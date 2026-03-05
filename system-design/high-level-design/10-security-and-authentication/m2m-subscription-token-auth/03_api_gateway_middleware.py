"""
03_api_gateway_middleware.py
============================
JWT validation middleware for the resource API (the API your M2M clients call).

This runs on EVERY inbound request:
  1. Extract Bearer token from Authorization header
  2. Verify JWT signature with the auth server's public key
  3. Validate standard claims (exp, aud, iss) — PyJWT does this automatically
  4. Check the JTI against the Redis revocation list
  5. Attach client context to request.state for downstream handlers

Key: step 4 is what enables early revocation (cancellations, upgrades).
     Without it, a long-lived token is valid until exp — you can't kill it.

Run:
    uvicorn 03_api_gateway_middleware:app --reload --port 8000

Dependencies:
    pip install fastapi uvicorn pyjwt[cryptography] redis python-dotenv
"""

import os
from functools import lru_cache

import jwt
import redis.asyncio as aioredis
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, Request, status
from fastapi.responses import JSONResponse

load_dotenv()

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
# In production: load public key from AWS SSM / Secrets Manager
PUBLIC_KEY: str = os.getenv("JWT_PUBLIC_KEY", _load_dev_public_key())
ISSUER: str     = os.getenv("JWT_ISSUER",     "https://auth.yourplatform.com")
AUDIENCE: str   = os.getenv("JWT_AUDIENCE",   "https://api.yourplatform.com")
REDIS_URL: str  = os.getenv("REDIS_URL",      "redis://localhost:6379/0")

# Redis key prefix for the revocation set
REVOKED_KEY_PREFIX = "revoked_jti:"


def _load_dev_public_key() -> str:
    key_path = os.path.join(os.path.dirname(__file__), "dev_public_key.pem")
    if os.path.exists(key_path):
        with open(key_path) as f:
            return f.read()
    raise RuntimeError("JWT_PUBLIC_KEY not set and dev_public_key.pem not found")


# ---------------------------------------------------------------------------
# Redis client (shared singleton)
# ---------------------------------------------------------------------------
_redis_client: aioredis.Redis = None


async def get_redis() -> aioredis.Redis:
    global _redis_client
    if _redis_client is None:
        _redis_client = await aioredis.from_url(REDIS_URL, decode_responses=True)
    return _redis_client


# ---------------------------------------------------------------------------
# Token validation
# ---------------------------------------------------------------------------
async def verify_m2m_token(request: Request) -> dict:
    """
    FastAPI dependency — validates the JWT and populates request.state.

    Usage in route handlers:
        @app.get("/data")
        async def get_data(request: Request, _=Depends(verify_m2m_token)):
            client_id = request.state.client_id
            plan      = request.state.plan
            ...
    """
    # 1. Extract token from header
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or malformed Authorization header. Expected: Bearer <token>",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = auth_header[len("Bearer "):]

    # 2. Decode + verify JWT
    #    PyJWT automatically validates: exp, iat, nbf, aud, iss
    #    leeway=30 handles minor clock skew between servers
    try:
        payload = jwt.decode(
            token,
            PUBLIC_KEY,
            algorithms=["RS256"],
            audience=AUDIENCE,
            issuer=ISSUER,
            leeway=30,                      # 30-second clock skew tolerance
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired. Your subscription may have ended — please renew.",
            headers={"WWW-Authenticate": "Bearer error=\"invalid_token\""},
        )
    except jwt.InvalidAudienceError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token audience mismatch.",
        )
    except jwt.InvalidIssuerError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token issuer not trusted.",
        )
    except jwt.InvalidTokenError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {exc}",
        )

    # 3. Check revocation list in Redis (O(1) lookup)
    #    Covers: early cancellations, mid-period upgrades, secret rotations
    jti   = payload.get("jti")
    redis = await get_redis()

    if jti and await redis.exists(f"{REVOKED_KEY_PREFIX}{jti}"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has been revoked. Please re-authenticate.",
        )

    # 4. Attach claims to request state for downstream handlers
    request.state.client_id   = payload["sub"]
    request.state.client_name = payload.get("client_name", "")
    request.state.plan        = payload.get("plan", "unknown")
    request.state.scope       = payload.get("scope", "")
    request.state.jti         = jti

    return payload


# ---------------------------------------------------------------------------
# Scope / plan authorization helpers
# ---------------------------------------------------------------------------
def require_scope(required_scope: str):
    """
    Factory for scope-based authorization dependencies.

    Usage:
        @app.post("/admin/action")
        async def admin_action(_=Depends(require_scope("admin"))):
            ...
    """
    async def _check(request: Request, _=Depends(verify_m2m_token)):
        scopes = request.state.scope.split()
        if required_scope not in scopes:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient scope. Required: {required_scope}",
            )
    return _check


def require_plan(minimum_plan: str):
    """
    Factory for plan-tier authorization dependencies.
    Plan hierarchy: monthly < quarterly < yearly

    Usage:
        @app.get("/premium-endpoint")
        async def premium(_=Depends(require_plan("yearly"))):
            ...
    """
    PLAN_RANK = {"monthly": 1, "quarterly": 2, "yearly": 3}
    required_rank = PLAN_RANK.get(minimum_plan, 0)

    async def _check(request: Request, _=Depends(verify_m2m_token)):
        client_rank = PLAN_RANK.get(request.state.plan, 0)
        if client_rank < required_rank:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"This endpoint requires a {minimum_plan} plan or higher.",
            )
    return _check


# ---------------------------------------------------------------------------
# Example resource API using the middleware
# ---------------------------------------------------------------------------
app = FastAPI(title="M2M Resource API")


@app.on_event("startup")
async def startup():
    await get_redis()


@app.get(
    "/api/data",
    summary="General data endpoint (any authenticated client)",
    dependencies=[Depends(verify_m2m_token)],
)
async def get_data(request: Request):
    return {
        "message": "Hello from the resource API",
        "client_id":   request.state.client_id,
        "client_name": request.state.client_name,
        "plan":        request.state.plan,
    }


@app.get(
    "/api/reports",
    summary="Reports — requires quarterly or yearly plan",
    dependencies=[Depends(require_plan("quarterly"))],
)
async def get_reports(request: Request):
    return {
        "report":  "full analytics",
        "plan":    request.state.plan,
    }


@app.get(
    "/api/admin",
    summary="Admin endpoint — requires 'admin' scope",
    dependencies=[Depends(require_scope("admin"))],
)
async def admin_endpoint(request: Request):
    return {"message": "Admin access granted"}


@app.get("/health")
async def health():
    return {"status": "ok"}


# ---------------------------------------------------------------------------
# Dev entrypoint
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("03_api_gateway_middleware:app", host="0.0.0.0", port=8000, reload=True)
