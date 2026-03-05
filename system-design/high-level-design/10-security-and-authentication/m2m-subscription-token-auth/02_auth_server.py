"""
02_auth_server.py
=================
Auth server — POST /oauth/token (OAuth 2.0 Client Credentials Grant)

Responsibilities:
  1. Validate client_id + client_secret (HTTP Basic auth)
  2. Fetch the client's active subscription
  3. Issue a JWT whose exp = subscription.expires_at
  4. Persist the token JTI for audit / revocation

Run:
    uvicorn 02_auth_server:app --reload --port 8001

Dependencies:
    pip install fastapi uvicorn pyjwt[cryptography] bcrypt asyncpg python-dotenv
"""

import uuid
import bcrypt
from datetime import datetime, timezone
from typing import Optional

import jwt
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from pydantic import BaseModel

# ---------------------------------------------------------------------------
# Configuration  (load from environment / AWS Secrets Manager in production)
# ---------------------------------------------------------------------------
import os
from dotenv import load_dotenv

load_dotenv()

# RS256: auth server holds the private key, API servers hold the public key.
# In production: load from AWS Secrets Manager or SSM Parameter Store.
PRIVATE_KEY: str = os.getenv("JWT_PRIVATE_KEY", _load_dev_private_key())
ISSUER: str      = os.getenv("JWT_ISSUER",      "https://auth.yourplatform.com")
AUDIENCE: str    = os.getenv("JWT_AUDIENCE",    "https://api.yourplatform.com")
DB_DSN: str      = os.getenv("DATABASE_URL",    "postgresql://user:pass@localhost/m2m_auth")


def _load_dev_private_key() -> str:
    """Load a local PEM file for development. Never do this in production."""
    key_path = os.path.join(os.path.dirname(__file__), "dev_private_key.pem")
    if os.path.exists(key_path):
        with open(key_path) as f:
            return f.read()
    # Fallback: generate an ephemeral key (restart = new key, tokens break)
    from cryptography.hazmat.primitives.asymmetric import rsa
    from cryptography.hazmat.primitives import serialization
    private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    return private_key.private_bytes(
        serialization.Encoding.PEM,
        serialization.PrivateFormat.TraditionalOpenSSL,
        serialization.NoEncryption(),
    ).decode()


# ---------------------------------------------------------------------------
# Database layer  (asyncpg — swap for SQLAlchemy async if preferred)
# ---------------------------------------------------------------------------
import asyncpg

_pool: Optional[asyncpg.Pool] = None


async def get_pool() -> asyncpg.Pool:
    global _pool
    if _pool is None:
        _pool = await asyncpg.create_pool(DB_DSN)
    return _pool


async def get_client(client_id: str) -> Optional[dict]:
    """Return client row or None."""
    pool = await get_pool()
    row = await pool.fetchrow(
        "SELECT client_id, client_secret, name, is_active FROM clients WHERE client_id = $1",
        client_id,
    )
    return dict(row) if row else None


async def get_active_subscription(client_id: str) -> Optional[dict]:
    """Return the active (non-expired) subscription for this client."""
    pool = await get_pool()
    row = await pool.fetchrow(
        """
        SELECT id, plan, starts_at, expires_at
        FROM   subscriptions
        WHERE  client_id = $1
          AND  is_active  = TRUE
          AND  expires_at > NOW()
        ORDER  BY expires_at DESC
        LIMIT  1
        """,
        client_id,
    )
    return dict(row) if row else None


async def save_issued_token(jti: str, client_id: str, issued_at: datetime, expires_at: datetime) -> None:
    pool = await get_pool()
    await pool.execute(
        """
        INSERT INTO issued_tokens (jti, client_id, issued_at, expires_at)
        VALUES ($1, $2, $3, $4)
        """,
        jti, client_id, issued_at, expires_at,
    )


# ---------------------------------------------------------------------------
# Response model
# ---------------------------------------------------------------------------
class TokenResponse(BaseModel):
    access_token: str
    token_type:   str = "bearer"
    expires_in:   int           # seconds until expiry
    plan:         str           # 'monthly' | 'quarterly' | 'yearly'


# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------
app = FastAPI(title="M2M Auth Server")
security = HTTPBasic()


@app.on_event("startup")
async def startup():
    await get_pool()  # warm the connection pool


@app.post(
    "/oauth/token",
    response_model=TokenResponse,
    summary="OAuth 2.0 Client Credentials Grant",
    description=(
        "Exchange client_id + client_secret for a JWT. "
        "Token expiry is aligned with the client's active subscription period."
    ),
)
async def issue_token(credentials: HTTPBasicCredentials = Depends(security)):
    # ------------------------------------------------------------------
    # Step 1 — Validate client credentials
    # ------------------------------------------------------------------
    client = await get_client(credentials.username)

    if not client or not client["is_active"]:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid client_id or client is disabled",
            headers={"WWW-Authenticate": "Basic"},
        )

    password_matches = bcrypt.checkpw(
        credentials.password.encode("utf-8"),
        client["client_secret"].encode("utf-8"),
    )
    if not password_matches:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid client_secret",
            headers={"WWW-Authenticate": "Basic"},
        )

    # ------------------------------------------------------------------
    # Step 2 — Fetch active subscription
    # ------------------------------------------------------------------
    subscription = await get_active_subscription(client["client_id"])
    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No active subscription. Please renew your plan.",
        )

    # ------------------------------------------------------------------
    # Step 3 — Build JWT payload
    #          exp is set directly to subscription.expires_at — the key
    #          innovation of this pattern
    # ------------------------------------------------------------------
    now          = datetime.now(timezone.utc)
    token_expiry = subscription["expires_at"]
    jti          = str(uuid.uuid4())

    # Sanity check: expiry must be in the future (should already be, but be safe)
    if token_expiry <= now:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Subscription has already expired.",
        )

    payload = {
        # Standard JWT claims
        "iss": ISSUER,
        "sub": str(client["client_id"]),       # client is the subject
        "aud": AUDIENCE,
        "iat": int(now.timestamp()),
        "exp": int(token_expiry.timestamp()),   # <-- subscription.expires_at
        "jti": jti,
        # Custom claims — embedded so API servers don't need a DB lookup
        "plan":        subscription["plan"],
        "client_name": client["name"],
        "scope":       "read write",            # expand per your requirements
    }

    token = jwt.encode(payload, PRIVATE_KEY, algorithm="RS256")

    # ------------------------------------------------------------------
    # Step 4 — Persist for audit trail + future revocation
    # ------------------------------------------------------------------
    await save_issued_token(jti, str(client["client_id"]), now, token_expiry)

    return TokenResponse(
        access_token=token,
        expires_in=int((token_expiry - now).total_seconds()),
        plan=subscription["plan"],
    )


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------
@app.get("/health")
async def health():
    return {"status": "ok"}


# ---------------------------------------------------------------------------
# Dev entrypoint
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("02_auth_server:app", host="0.0.0.0", port=8001, reload=True)
