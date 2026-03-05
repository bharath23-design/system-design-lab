"""
05_aws_cognito_integration.py
==============================
AWS Cognito-based implementation of M2M subscription-aligned token auth.

Cognito doesn't natively support M2M client credentials with subscription-aligned
expiry, but we can compose it using:

  1. Cognito App Clients   → represent each B2B customer (client_id / secret)
  2. User Pool Attributes  → store subscription metadata per client
  3. Pre Token Generation Lambda → inject subscription claims into the JWT
  4. Token Revocation     → Cognito's built-in token revocation + our Redis list

Architecture:
  ┌────────────────┐     Client Credentials    ┌──────────────────────┐
  │  B2B Client    │ ────────────────────────► │   AWS Cognito        │
  │  (their server)│                           │   User Pool          │
  └────────────────┘                           │                      │
                                               │  Pre Token Gen       │
                                               │  Lambda Trigger  ──► reads subscription
                                               │                      │   metadata from DDB
                                               │  Issues JWT with     │
                                               │  custom exp claim    │
                                               └──────────────────────┘

NOTE: Cognito does not let you override the standard `exp` claim directly.
The workaround:
  - Set a long Access Token expiry in Cognito (e.g., 1 year max)
  - Embed `subscription_expires_at` as a custom claim
  - Your API middleware checks the custom claim, NOT standard exp
  - Revocation is handled via Redis blocklist (see 03_api_gateway_middleware.py)

Dependencies:
    pip install boto3 python-dotenv fastapi

"""

import os
import json
import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional

import boto3
from dotenv import load_dotenv

load_dotenv()

AWS_REGION      = os.getenv("AWS_REGION",         "ap-south-1")
USER_POOL_ID    = os.getenv("COGNITO_USER_POOL_ID")
APP_CLIENT_ID   = os.getenv("COGNITO_APP_CLIENT_ID")
DYNAMODB_TABLE  = os.getenv("SUBSCRIPTIONS_TABLE", "m2m_subscriptions")

cognito  = boto3.client("cognito-idp",  region_name=AWS_REGION)
dynamodb = boto3.resource("dynamodb",   region_name=AWS_REGION)
secretsm = boto3.client("secretsmanager", region_name=AWS_REGION)


# ---------------------------------------------------------------------------
# DynamoDB: subscription store (alternative to PostgreSQL for serverless stacks)
# ---------------------------------------------------------------------------
#
# Table schema:
#   PK: client_id (String)
#   Attributes:
#     plan (String)       : 'monthly' | 'quarterly' | 'yearly'
#     starts_at (String)  : ISO timestamp
#     expires_at (String) : ISO timestamp  ← THE important field
#     is_active (Boolean)
#

def get_active_subscription_dynamo(client_id: str) -> Optional[dict]:
    table = dynamodb.Table(DYNAMODB_TABLE)
    resp  = table.get_item(Key={"client_id": client_id})
    item  = resp.get("Item")
    if not item:
        return None
    if not item.get("is_active"):
        return None
    expires_at = datetime.fromisoformat(item["expires_at"])
    if expires_at <= datetime.now(timezone.utc):
        return None
    return item


def upsert_subscription_dynamo(client_id: str, plan: str, expires_at: datetime) -> None:
    """Create or update a client's subscription in DynamoDB."""
    table = dynamodb.Table(DYNAMODB_TABLE)
    table.put_item(Item={
        "client_id":  client_id,
        "plan":       plan,
        "starts_at":  datetime.now(timezone.utc).isoformat(),
        "expires_at": expires_at.isoformat(),
        "is_active":  True,
    })


def deactivate_subscription_dynamo(client_id: str) -> None:
    table = dynamodb.Table(DYNAMODB_TABLE)
    table.update_item(
        Key={"client_id": client_id},
        UpdateExpression="SET is_active = :f",
        ExpressionAttributeValues={":f": False},
    )


# ---------------------------------------------------------------------------
# Cognito: create an App Client per B2B customer
# ---------------------------------------------------------------------------

def create_m2m_app_client(client_name: str) -> dict:
    """
    Creates a Cognito App Client (= M2M client credentials) for a new B2B customer.
    Returns client_id + client_secret to hand to the customer.
    """
    response = cognito.create_user_pool_client(
        UserPoolId=USER_POOL_ID,
        ClientName=client_name,
        GenerateSecret=True,                    # M2M clients use client secret
        ExplicitAuthFlows=[],                   # no human auth flows
        AllowedOAuthFlows=["client_credentials"],
        AllowedOAuthScopes=["read", "write"],   # define in Cognito Resource Server
        AllowedOAuthFlowsUserPoolClient=True,
        # Set a long expiry — actual subscription check is in the Lambda trigger
        AccessTokenValidity=525600,             # 525600 minutes = 1 year (Cognito max)
        TokenValidityUnits={"AccessToken": "minutes"},
    )
    client = response["UserPoolClient"]
    return {
        "client_id":     client["ClientId"],
        "client_secret": client["ClientSecret"],
        "client_name":   client_name,
    }


def store_client_metadata_in_cognito(client_id: str, plan: str, expires_at: datetime) -> None:
    """
    Stores subscription metadata as User Pool App Client metadata.
    This is read by the Pre Token Generation Lambda to inject custom claims.

    Cognito App Clients don't have custom attributes directly, so we use
    a separate metadata store (DynamoDB) keyed by client_id.
    The Lambda reads from DynamoDB at token issuance time.
    """
    upsert_subscription_dynamo(client_id, plan, expires_at)


# ---------------------------------------------------------------------------
# Lambda Trigger: Pre Token Generation
# (Deploy this as a Lambda function and attach to your User Pool)
# ---------------------------------------------------------------------------

def pre_token_generation_handler(event: dict, context) -> dict:
    """
    AWS Lambda function — triggered by Cognito before issuing a token.

    Cognito calls this with the client_id embedded in the event.
    We look up the subscription and inject custom claims.

    Note: Cognito does NOT allow overriding `exp` via this trigger.
    We inject `subscription_expires_at` as a custom claim instead.
    Your API middleware (03_api_gateway_middleware.py) must check THIS claim.

    Attach to User Pool:
      Cognito → User Pool → Triggers → Pre Token Generation → [this Lambda ARN]
    """
    # Extract the client_id (username in client credentials flow)
    client_id = event["userName"]           # in client_credentials, this is the App Client ID

    # Look up subscription from DynamoDB
    import boto3 as _boto3
    _dynamodb = _boto3.resource("dynamodb")
    table     = _dynamodb.Table(os.environ["SUBSCRIPTIONS_TABLE"])
    resp      = table.get_item(Key={"client_id": client_id})
    item      = resp.get("Item", {})

    plan              = item.get("plan", "none")
    expires_at        = item.get("expires_at", "")
    is_active         = item.get("is_active", False)

    # Inject custom claims into the token
    event["response"] = {
        "claimsOverrideDetails": {
            "claimsToAddOrOverride": {
                "plan":                   plan,
                "subscription_expires_at": expires_at,      # ISO string
                "subscription_active":    str(is_active).lower(),
                "client_name":            item.get("client_name", client_id),
            },
            # Do not suppress standard claims
            "claimsToSuppress": [],
        }
    }

    return event


# ---------------------------------------------------------------------------
# API middleware — Cognito-compatible token validation
# (replaces the RS256 check in 03_api_gateway_middleware.py for Cognito tokens)
# ---------------------------------------------------------------------------
import jwt                          # PyJWT
import httpx                        # to fetch Cognito JWKS

_cognito_jwks: Optional[dict] = None


async def get_cognito_public_keys() -> dict:
    """
    Fetch Cognito's JWKS (public keys) and cache them.
    Cognito rotates keys rarely — caching for the process lifetime is fine.
    In production, add a TTL-based refresh.
    """
    global _cognito_jwks
    if _cognito_jwks is not None:
        return _cognito_jwks

    jwks_url = (
        f"https://cognito-idp.{AWS_REGION}.amazonaws.com"
        f"/{USER_POOL_ID}/.well-known/jwks.json"
    )
    async with httpx.AsyncClient() as client:
        resp = await client.get(jwks_url)
        resp.raise_for_status()
        _cognito_jwks = resp.json()
    return _cognito_jwks


async def validate_cognito_m2m_token(token: str) -> dict:
    """
    Validate a Cognito-issued token and check subscription claims.

    Since Cognito doesn't let us set `exp` to subscription expiry,
    we validate `subscription_expires_at` (our custom claim) instead.
    """
    from fastapi import HTTPException, status

    # 1. Decode header to find key ID (kid)
    try:
        header = jwt.get_unverified_header(token)
    except jwt.exceptions.DecodeError:
        raise HTTPException(status_code=401, detail="Malformed token")

    # 2. Fetch public keys and find the right one
    jwks = await get_cognito_public_keys()
    key  = next(
        (k for k in jwks["keys"] if k["kid"] == header.get("kid")), None
    )
    if not key:
        raise HTTPException(status_code=401, detail="Token signing key not found")

    public_key = jwt.algorithms.RSAAlgorithm.from_jwk(json.dumps(key))

    # 3. Verify signature + standard claims
    try:
        payload = jwt.decode(
            token,
            public_key,
            algorithms=["RS256"],
            audience=APP_CLIENT_ID,
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError as exc:
        raise HTTPException(status_code=401, detail=f"Invalid token: {exc}")

    # 4. Check our custom subscription_expires_at claim
    sub_expires_str = payload.get("subscription_expires_at", "")
    if not sub_expires_str:
        raise HTTPException(status_code=403, detail="Token missing subscription claim")

    sub_expires = datetime.fromisoformat(sub_expires_str)
    if sub_expires <= datetime.now(timezone.utc):
        raise HTTPException(
            status_code=401,
            detail="Subscription has expired. Please renew your plan.",
        )

    if payload.get("subscription_active") != "true":
        raise HTTPException(status_code=403, detail="Subscription is not active")

    return payload


# ---------------------------------------------------------------------------
# Secrets Manager: rotate client secrets
# ---------------------------------------------------------------------------

def rotate_client_secret(cognito_client_id: str) -> dict:
    """
    Forces rotation of a Cognito App Client secret.
    Call this on: security incident, periodic rotation policy, client request.
    After rotation, the client must use the new secret immediately.
    """
    # Cognito doesn't support secret rotation in-place — delete and recreate
    # is the pattern. In practice, use a brief overlap window:
    #
    # 1. Note current secret (store temporarily in Secrets Manager)
    # 2. Create new client with same settings
    # 3. Notify customer of new client_id + secret
    # 4. After grace period, delete old client
    #
    # This is a limitation of Cognito vs. a custom auth server.
    raise NotImplementedError(
        "Cognito App Client secrets cannot be rotated in-place. "
        "Create a new App Client, notify client, then decommission old one after grace period."
    )


def store_secret_in_secrets_manager(name: str, secret_value: dict) -> str:
    """Store sensitive values in AWS Secrets Manager."""
    response = secretsm.create_secret(
        Name=name,
        SecretString=json.dumps(secret_value),
        Description=f"M2M client credentials for {name}",
    )
    return response["ARN"]


# ---------------------------------------------------------------------------
# Putting it all together: onboarding a new B2B client
# ---------------------------------------------------------------------------

def onboard_new_client(client_name: str, plan: str, subscription_months: int) -> dict:
    """
    Full onboarding flow for a new B2B customer.

    1. Create Cognito App Client (credentials)
    2. Calculate subscription expiry based on plan
    3. Store subscription metadata in DynamoDB
    4. Optionally store credentials in Secrets Manager for the client

    Returns the credentials to hand to the customer (securely!).
    """
    # 1. Create Cognito App Client
    client_creds = create_m2m_app_client(client_name)

    # 2. Calculate expiry
    now        = datetime.now(timezone.utc)
    expires_at = now + timedelta(days=30 * subscription_months)

    # 3. Store subscription in DynamoDB (Lambda will read this at token issuance)
    upsert_subscription_dynamo(
        client_id  = client_creds["client_id"],
        plan       = plan,
        expires_at = expires_at,
    )

    # 4. Store credentials in Secrets Manager (optional — send to client securely)
    secret_name = f"m2m/clients/{client_creds['client_id']}"
    store_secret_in_secrets_manager(secret_name, {
        "client_id":     client_creds["client_id"],
        "client_secret": client_creds["client_secret"],
        "plan":          plan,
        "expires_at":    expires_at.isoformat(),
    })

    print(f"[ONBOARD] Client '{client_name}' created:")
    print(f"  client_id:  {client_creds['client_id']}")
    print(f"  plan:       {plan}")
    print(f"  expires_at: {expires_at.isoformat()}")
    print(f"  Credentials stored in Secrets Manager: {secret_name}")

    return {
        "client_id":     client_creds["client_id"],
        "client_secret": client_creds["client_secret"],   # hand this to the customer NOW
        "plan":          plan,
        "expires_at":    expires_at.isoformat(),
        "token_endpoint": f"https://your-domain.auth.{AWS_REGION}.amazoncognito.com/oauth2/token",
    }