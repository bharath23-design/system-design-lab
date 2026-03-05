"""
04_subscription_events.py
=========================
Event handlers for subscription lifecycle events.

These are the critical glue that keeps billing and access control in sync.
In production, these are triggered by:
  - Webhook from your payment provider (Stripe, Chargebee, etc.)
  - Internal event bus (SNS → SQS → Lambda)
  - Admin API call

Three main lifecycle events:
  1. RENEWAL    — client upgrades or renews → revoke old, issue new
  2. CANCELLATION — client cancels → revoke immediately
  3. EXPIRY CHECK — daily cron → warn clients before their token expires

Key design: all revocations go to Redis (instant) AND the DB (audit trail).

Dependencies:
    pip install asyncpg redis python-dotenv httpx
"""

import os
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

import asyncpg
import redis.asyncio as aioredis
from dotenv import load_dotenv

load_dotenv()

DB_DSN    = os.getenv("DATABASE_URL", "postgresql://user:pass@localhost/m2m_auth")
REDIS_URL = os.getenv("REDIS_URL",    "redis://localhost:6379/0")

REVOKED_KEY_PREFIX = "revoked_jti:"

# How long to keep revoked JTIs in Redis (slightly beyond max possible token lifetime)
REVOCATION_TTL_SECONDS = 366 * 24 * 3600  # ~1 year + buffer


# ---------------------------------------------------------------------------
# Infrastructure helpers
# ---------------------------------------------------------------------------
_pool:   Optional[asyncpg.Pool]    = None
_redis:  Optional[aioredis.Redis]  = None


async def get_pool() -> asyncpg.Pool:
    global _pool
    if _pool is None:
        _pool = await asyncpg.create_pool(DB_DSN)
    return _pool


async def get_redis() -> aioredis.Redis:
    global _redis
    if _redis is None:
        _redis = await aioredis.from_url(REDIS_URL, decode_responses=True)
    return _redis


# ---------------------------------------------------------------------------
# Core revocation primitives
# ---------------------------------------------------------------------------
async def revoke_token(jti: str, reason: str, expires_at: datetime) -> None:
    """
    Revoke a single token by JTI.
    - Redis: for fast in-flight request checks
    - DB: for audit trail
    """
    now   = datetime.now(timezone.utc)
    redis = await get_redis()
    pool  = await get_pool()

    # 1. Add to Redis blocklist (TTL = remaining token lifetime, so it auto-cleans)
    remaining_seconds = max(0, int((expires_at - now).total_seconds()))
    if remaining_seconds > 0:
        await redis.setex(
            f"{REVOKED_KEY_PREFIX}{jti}",
            remaining_seconds,
            reason,
        )

    # 2. Mark revoked in DB for audit trail
    await pool.execute(
        """
        UPDATE issued_tokens
        SET    revoked = TRUE, revoked_at = $1, revoke_reason = $2
        WHERE  jti = $3
        """,
        now, reason, jti,
    )


async def revoke_all_tokens_for_client(client_id: str, reason: str) -> int:
    """
    Revoke every active (non-revoked, non-expired) token for a client.
    Returns the count of tokens revoked.
    Used on: cancellations, plan renewals, security incidents.
    """
    pool  = await get_pool()
    now   = datetime.now(timezone.utc)

    # Fetch all active tokens for this client
    rows = await pool.fetch(
        """
        SELECT jti, expires_at
        FROM   issued_tokens
        WHERE  client_id = $1
          AND  revoked    = FALSE
          AND  expires_at > $2
        """,
        client_id, now,
    )

    for row in rows:
        await revoke_token(str(row["jti"]), reason, row["expires_at"])

    return len(rows)


# ---------------------------------------------------------------------------
# Subscription DB helpers
# ---------------------------------------------------------------------------
async def update_subscription(
    client_id: str,
    new_plan: str,
    new_starts_at: datetime,
    new_expires_at: datetime,
) -> None:
    pool = await get_pool()
    async with pool.acquire() as conn:
        async with conn.transaction():
            # Deactivate old subscription
            await conn.execute(
                "UPDATE subscriptions SET is_active = FALSE WHERE client_id = $1 AND is_active = TRUE",
                client_id,
            )
            # Insert new subscription
            await conn.execute(
                """
                INSERT INTO subscriptions (id, client_id, plan, starts_at, expires_at, is_active)
                VALUES ($1, $2, $3, $4, $5, TRUE)
                """,
                str(uuid.uuid4()), client_id, new_plan, new_starts_at, new_expires_at,
            )


async def deactivate_subscription(client_id: str) -> None:
    pool = await get_pool()
    await pool.execute(
        "UPDATE subscriptions SET is_active = FALSE WHERE client_id = $1 AND is_active = TRUE",
        client_id,
    )


async def get_subscriptions_expiring_in_days(days: int) -> list[dict]:
    pool = await get_pool()
    now  = datetime.now(timezone.utc)
    rows = await pool.fetch(
        """
        SELECT s.client_id, s.plan, s.expires_at, c.name AS client_name
        FROM   subscriptions s
        JOIN   clients c ON c.client_id = s.client_id
        WHERE  s.is_active   = TRUE
          AND  s.expires_at  > $1
          AND  s.expires_at <= $2
        """,
        now,
        now + timedelta(days=days),
    )
    return [dict(r) for r in rows]


# ---------------------------------------------------------------------------
# Notification stub (replace with SES / SNS / Slack in production)
# ---------------------------------------------------------------------------
async def notify_client_reauth(client_id: str, reason: str) -> None:
    """
    In production: send an email or webhook to the client's registered endpoint
    telling them to call /oauth/token again with their credentials.
    """
    print(f"[NOTIFY] Client {client_id}: please re-authenticate. Reason: {reason}")


async def send_renewal_reminder(client_id: str, client_name: str, expires_at: datetime, plan: str) -> None:
    days_left = (expires_at - datetime.now(timezone.utc)).days
    print(
        f"[REMINDER] {client_name} ({client_id}) — {plan} plan expires in {days_left} days "
        f"({expires_at.date()}). Please renew."
    )


# ---------------------------------------------------------------------------
# Event handler 1 — RENEWAL / UPGRADE
# ---------------------------------------------------------------------------
async def handle_subscription_renewal(
    client_id: str,
    new_plan: str,
    new_expires_at: datetime,
) -> dict:
    """
    Called when a client renews their subscription or upgrades their plan.

    Flow:
      1. Revoke all existing tokens (they're tied to the old subscription expiry)
      2. Create new subscription record with new expiry
      3. Notify client to re-authenticate (they'll get a token with new exp)

    Typical trigger: Stripe `invoice.payment_succeeded` webhook
    """
    now = datetime.now(timezone.utc)

    # 1. Revoke old tokens
    revoked_count = await revoke_all_tokens_for_client(client_id, reason="subscription_renewal")

    # 2. Update subscription
    await update_subscription(
        client_id,
        new_plan=new_plan,
        new_starts_at=now,
        new_expires_at=new_expires_at,
    )

    # 3. Notify client — they need to call /oauth/token to get a fresh token
    await notify_client_reauth(client_id, reason=f"plan renewed to {new_plan}")

    return {
        "client_id":     client_id,
        "new_plan":      new_plan,
        "new_expires_at": new_expires_at.isoformat(),
        "tokens_revoked": revoked_count,
    }


# ---------------------------------------------------------------------------
# Event handler 2 — CANCELLATION
# ---------------------------------------------------------------------------
async def handle_subscription_cancellation(client_id: str) -> dict:
    """
    Called when a client cancels their subscription (mid-period).

    Flow:
      1. Immediately revoke all active tokens → API returns 401
      2. Deactivate subscription in DB
      3. Client can no longer get new tokens (no active subscription)

    Typical trigger: Stripe `customer.subscription.deleted` webhook
    """
    # 1. Revoke all active tokens immediately
    revoked_count = await revoke_all_tokens_for_client(client_id, reason="subscription_cancelled")

    # 2. Deactivate subscription
    await deactivate_subscription(client_id)

    return {
        "client_id":     client_id,
        "status":        "cancelled",
        "tokens_revoked": revoked_count,
    }


# ---------------------------------------------------------------------------
# Event handler 3 — DAILY EXPIRY CHECK (cron job)
# ---------------------------------------------------------------------------
async def daily_expiry_check() -> dict:
    """
    Runs daily (e.g., AWS EventBridge → Lambda, or a cron container).

    Actions:
      - Warn clients whose subscriptions expire within 7 days
      - Warn clients expiring within 1 day (urgent)
      - Log count of naturally expired subscriptions (cleanup)

    Natural expiry (exp fires in JWT) requires no action here —
    PyJWT will reject the token automatically. This job is purely for
    proactive customer communication.
    """
    results = {"warned_7d": 0, "warned_1d": 0}

    # 7-day warnings
    expiring_7d = await get_subscriptions_expiring_in_days(days=7)
    for sub in expiring_7d:
        await send_renewal_reminder(
            sub["client_id"], sub["client_name"], sub["expires_at"], sub["plan"]
        )
    results["warned_7d"] = len(expiring_7d)

    # 1-day urgent warnings (subset of 7d, but flagged as urgent)
    expiring_1d = await get_subscriptions_expiring_in_days(days=1)
    for sub in expiring_1d:
        print(f"[URGENT] {sub['client_name']} expires TOMORROW — escalate if no renewal")
    results["warned_1d"] = len(expiring_1d)

    return results


# ---------------------------------------------------------------------------
# FastAPI webhook receiver (for Stripe or internal event bus)
# ---------------------------------------------------------------------------
from fastapi import FastAPI, Request, HTTPException

app = FastAPI(title="Subscription Event Handler")


@app.post("/webhooks/subscription/renewed")
async def webhook_renewed(request: Request):
    """
    Stripe sends: customer.subscription.updated (when plan changes or renews)
    Internal: any billing system can POST here.
    """
    body = await request.json()
    # In production: verify Stripe webhook signature before processing
    client_id      = body["client_id"]
    new_plan       = body["plan"]                                   # 'monthly' | 'quarterly' | 'yearly'
    new_expires_at = datetime.fromisoformat(body["expires_at"])

    result = await handle_subscription_renewal(client_id, new_plan, new_expires_at)
    return result


@app.post("/webhooks/subscription/cancelled")
async def webhook_cancelled(request: Request):
    body      = await request.json()
    client_id = body["client_id"]
    result    = await handle_subscription_cancellation(client_id)
    return result


@app.post("/internal/cron/expiry-check")
async def cron_expiry_check():
    """Called by AWS EventBridge Scheduler daily."""
    result = await daily_expiry_check()
    return result


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("04_subscription_events:app", host="0.0.0.0", port=8002, reload=True)
