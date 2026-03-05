# M2M Token Authorization with Subscription-Aligned Expiration

## What is M2M (Machine-to-Machine) Authentication?

M2M authentication is used when **services communicate with each other** without human interaction:
- Your backend calling another API
- A cron job hitting an endpoint
- A client's server accessing your platform (B2B SaaS)

The standard protocol is **OAuth 2.0 Client Credentials Grant** — no user, no browser, just credentials exchanged for a token.

---

## The Core Concept: Subscription-Aligned Token Expiration

Instead of issuing short-lived tokens (15 min / 1 hour) that require constant re-authentication, you issue tokens whose **validity mirrors the client's subscription period**:

```
Client pays for Yearly Plan      → Token valid for 1 year
Client pays for Quarterly Plan   → Token valid for 3 months
Client pays for Monthly Plan     → Token valid for 1 month
```

When their subscription expires → token expires → access is automatically revoked.
When they renew → old token revoked → new token with fresh expiry issued.

This pattern is particularly powerful for **B2B SaaS** where customers are organizations running automated systems — they don't want to re-authenticate every hour, and you don't want to manually revoke access when they churn.

---

## Architecture Overview

```
┌─────────────────┐         ┌──────────────────┐        ┌─────────────────┐
│   Client Server │         │   Auth Server     │        │   Your API      │
│  (B2B Customer) │         │ (Token Issuer)    │        │  (Resource)     │
└────────┬────────┘         └────────┬─────────┘        └────────┬────────┘
         │                           │                            │
         │  1. POST /oauth/token     │                            │
         │  client_id + secret  ───► │                            │
         │                           │  2. Validate credentials   │
         │                           │  3. Lookup subscription    │
         │                           │  4. Set exp = sub.expiry   │
         │  ◄── 5. JWT Token ──────  │                            │
         │                           │                            │
         │  6. API Call + Bearer Token ─────────────────────────► │
         │                           │  7. Validate JWT sig       │
         │                           │  8. Check exp + claims     │
         │  ◄────────────── 9. 200 Response ─────────────────── │
         │                           │                            │
         │  (1 year later — no renewal)                           │
         │  API Call + Expired Token ───────────────────────────► │
         │  ◄────────────── 401 Unauthorized ────────────────── │
```

---

## Files in This Module

| File | Purpose |
|------|---------|
| `01_database_schema.sql` | PostgreSQL schema for clients, subscriptions, issued tokens |
| `02_auth_server.py` | FastAPI auth server — token issuance endpoint |
| `03_api_gateway_middleware.py` | JWT validation middleware for your resource API |
| `04_subscription_events.py` | Handlers for renewal, cancellation, expiry events |
| `05_aws_cognito_integration.py` | Cognito-based implementation with Lambda triggers |

---

## Key Design Decisions

### Why long-lived tokens tied to subscriptions?

**Problem with short-lived tokens in M2M:**
- Clients need constant re-authentication (every 15 min / 1 hour)
- More complexity in client code (token refresh logic)
- Higher load on auth server

**Problem with truly permanent tokens (no expiry):**
- No automatic revocation on subscription end
- Security risk if compromised — valid forever
- Manual revocation process needed for churned customers

**Solution — subscription-aligned expiry:**
- Token is valid as long as the business relationship is active
- Automatic access revocation when subscription ends
- Billing system and access control are synchronized without extra code

### Why JWTs instead of opaque tokens?

- **Stateless validation** — your API doesn't need to call the auth server on every request
- **Self-contained claims** — plan, client_id, scopes all embedded in the token
- **Standard ecosystem** — works with API gateways, AWS, Nginx, any JWT library

### Why RS256 instead of HS256?

- **RS256 (asymmetric):** Auth server holds private key (signs), API servers hold public key (verify)
- **HS256 (symmetric):** Same secret on auth + API servers — if one is compromised, all are compromised
- For multi-service architectures, RS256 is the only sane choice

---

## Security Considerations

### Revocation (the hard problem with long-lived JWTs)

Since JWTs are stateless, revoking them before expiry requires a blocklist:

```
Token issued → JTI stored in Redis (with TTL = token expiry)
Client cancels → JTI added to revocation set in Redis
API validates → checks Redis revocation set on each request
```

Redis O(1) lookup keeps this fast even at scale.

### Rotation on renewal

When a subscription renews or upgrades:
1. All existing tokens for that client are revoked (JTIs added to blocklist)
2. New subscription record is created with new expiry
3. Client is notified (webhook) to re-authenticate
4. Client calls `/oauth/token` → gets fresh token with new expiry

### What if the client secret is compromised?

1. Rotate the secret in your DB and AWS Secrets Manager
2. Revoke all active tokens for that client (`revoke_all_tokens_for_client()`)
3. Issue new credentials to the client out-of-band
4. Client re-authenticates with new secret

---

## Production Checklist

| Concern | Solution |
|---------|---------|
| Token too long-lived | JTI + revocation list in Redis for instant invalidation |
| Subscription cancelled early | Trigger immediate revocation via SNS/SQS event |
| Token rotation on renewal | Webhook notifies client to re-fetch token |
| Secret rotation | AWS Secrets Manager, rotate client secrets periodically |
| Audit trail | Log every issuance + usage to CloudWatch / S3 |
| Clock skew | Add `leeway=30` seconds in JWT decode |
| Key management | RS256 with RSA key pair, rotate annually |
| Expiry warnings | Cron job: alert clients 7 days before subscription expires |

---

## Flow Summary

```
Subscription Created
    → Client gets credentials (client_id + secret)

Client calls POST /oauth/token
    → Auth server validates credentials
    → Looks up subscription.expires_at
    → Issues JWT with exp = subscription.expires_at

Client uses token for all API calls (no re-auth for entire subscription period)

Subscription expires naturally
    → JWT exp fires → 401 Unauthorized → client is forced to renew

Client cancels mid-period
    → Webhook triggers revoke_all_tokens_for_client()
    → JTI blocklisted in Redis → immediate 401

Client renews subscription
    → Old token revoked
    → New token issued with new expiry date
```

The elegance: **billing and access control are synchronized automatically** — no manual revocation on churn, no cron jobs hunting for expired customers, no missed access removals.
