# Security and Authentication — High-Level Design Concepts

## Overview

Security and authentication are central to system design. This module covers how to identify users (authentication), what they can do (authorization), and how to protect data and APIs. Interviewers expect clear trade-offs between complexity, usability, and security.

---

## 1. Authentication Basics

### Concept

- **Authentication** answers “Who are you?” — verifying identity (e.g., username/password, SSO, certificates).
- **Authorization** answers “What can you do?” — enforcing permissions after identity is known.
- Design choices: stateful (sessions) vs stateless (tokens), centralized vs federated identity.

### When to Use

- Every system that has users or services calling APIs needs an authentication story.
- Choose stateful vs stateless based on scale, multi-service needs, and revocation requirements.

### Trade-offs

| Pros (stateless tokens) | Cons |
|-------------------------|------|
| No server-side session store | Hard to revoke before expiry |
| Easy to scale horizontally | Token size and payload limits |
| Pros (sessions) | Cons |
| Easy to revoke (delete session) | Need shared or sticky session store |
| Simpler token (opaque ID) | More state to manage at scale |

---

## 2. OAuth 2.0 and OpenID Connect (OIDC)

### Concept

- **OAuth 2.0**: Authorization framework — “allow app X to access my resources without giving my password.” Uses roles: Resource Owner, Client, Authorization Server, Resource Server. Flows: Authorization Code (with PKCE), Client Credentials, Refresh Token, etc.
- **OIDC**: Identity layer on top of OAuth — adds ID token (JWT) with user identity (claims), so you get both “authorize app” and “who is the user.”

### When to Use

- Third-party apps accessing user data (e.g., “Login with Google,” API access on behalf of users).
- Single Sign-On (SSO) across multiple apps or organizations (OIDC).

### Trade-offs

| Pros | Cons |
|------|------|
| No password sharing with clients | Protocol and implementation complexity |
| Delegated authorization and SSO | Many flows; easy to misuse (e.g., implicit flow) |
| Industry standard | Requires understanding of tokens, redirects, and PKCE |

---

## 3. JWT (JSON Web Tokens)

### Concept

- **JWT**: Compact, signed (and optionally encrypted) token with three parts: header, payload (claims), signature. Used as access tokens or ID tokens. Often short-lived; refresh token used to get new access token.
- **Verification**: Check signature (and optionally issuer, audience, expiry) on every request. No server-side session lookup if stateless.

### When to Use

- Stateless APIs and microservices; same token can be validated by many services with shared secret or public key.
- When you need to carry claims (user id, roles, scopes) in the token.

### Trade-offs

| Pros | Cons |
|------|------|
| Stateless; no session store | Revocation before expiry is hard (use short TTL + refresh) |
| Portable across services | Payload is visible if not encrypted (JWE) |
| Standard (RFC 7519) | Key management and rotation matter |

---

## 4. Session-Based Authentication

### Concept

- Server creates a **session** after login (stored server-side or in a shared store like Redis). Client gets an opaque **session ID** (in cookie or header). Each request sends the ID; server looks up session to get user identity and permissions.
- **Cookie attributes**: HttpOnly, Secure, SameSite to reduce XSS/CSRF risk.

### When to Use

- Traditional web apps where the server renders pages and controls cookies.
- When you need immediate revocation (delete session) or strict server-side control.

### Trade-offs

| Pros | Cons |
|------|------|
| Easy to invalidate | Requires shared or sticky session store for scale |
| No token size/claim limits | Cookie size and cross-domain constraints |
| Familiar model | CSRF protection (e.g., SameSite, CSRF tokens) needed |

---

## 5. API Keys and Service-to-Service Auth

### Concept

- **API keys**: Long-lived secrets identifying a client or app. Used for server-to-server or script access. Often sent in header (e.g., `X-API-Key`) or as query param (less secure).
- **Service accounts**: Identity for a service; can use API keys, mTLS, or OAuth2 Client Credentials to get tokens.

### When to Use

- Machine-to-machine (M2M) or app-to-backend where no “user” is in the loop.
- Internal services, partners, or programmatic access.

### Trade-offs

| Pros | Cons |
|------|------|
| Simple to implement and use | Key leakage = full access until rotated |
| No expiry by default (or long TTL) | No user-level identity unless combined with other data |
| | Rotation and storage (secrets manager) are critical |

---

## 6. RBAC (Role-Based Access Control)

### Concept

- Permissions are assigned to **roles**; users (or services) are assigned **roles**. Access check: “Does this user’s role have permission X?”
- Model: User → Role(s) → Permission(s) → Resource/Action.

### When to Use

- Enterprise apps with well-defined job functions (admin, editor, viewer).
- When policy is “who you are” (role) rather than “what attribute the resource has.”

### Trade-offs

| Pros | Cons |
|------|------|
| Simple to reason about and implement | Role explosion; coarse granularity |
| Easy to audit (“who has admin?”) | Hard to express “owner of this resource” without extra logic |
| | Multi-tenant “same role, different data” needs resource scope |

---

## 7. ABAC (Attribute-Based Access Control)

### Concept

- Access is determined by **attributes** of the user, resource, action, and environment (e.g., time, IP). Policies are rules over these attributes (e.g., “allow if user.department == resource.owner_department”).

### When to Use

- Fine-grained or context-dependent policies (e.g., “only during work hours,” “only from corporate network”).
- When RBAC is too coarse or would require too many roles.

### Trade-offs

| Pros | Cons |
|------|------|
| Very flexible policies | Complexity and performance (policy evaluation) |
| Can encode relationship and context | Harder to audit and debug |
| | Often needs a policy engine (e.g., Open Policy Agent) |

---

## 8. Encryption (At Rest and In Transit)

### Concept

- **In transit**: TLS (HTTPS) between client and server and between services. Protects against eavesdropping and tampering.
- **At rest**: Encrypt databases, backups, and sensitive files (e.g., AES). Keys managed via KMS; often envelope encryption (data key encrypted by master key).

### When to Use

- In transit: Always for any sensitive or personal data.
- At rest: Required for compliance (e.g., PCI, HIPAA) and for sensitive datasets.

### Trade-offs

| Pros | Cons |
|------|------|
| Confidentiality and integrity | Key management and rotation |
| Compliance enabler | Performance (minimal if done in hardware or efficient libs) |
| | Lost keys = lost data; backup key strategy needed |

---

## 9. Hashing and Password Storage

### Concept

- Passwords must **never** be stored in plain text. Use a **one-way hash** (e.g., bcrypt, Argon2, scrypt) with a **salt** (unique per password). Verification: hash(input + salt) and compare with stored hash.
- **Pepper** (secret server-side value) adds another layer if the DB is leaked.

### When to Use

- Any system that stores user passwords (or equivalent secrets). Prefer modern algorithms (Argon2/bcrypt) and appropriate cost factors.

### Trade-offs

| Pros | Cons |
|------|------|
| Leak of DB does not reveal passwords | Cannot recover password; reset flow needed |
| Standard practice | Tuning cost vs brute-force resistance vs latency |
| | Salt/pepper must be managed correctly |

---

## 10. Rate Limiting and Throttling

### Concept

- **Rate limiting**: Cap how many requests a client (IP, user, API key) can make in a window (e.g., 100 req/min). Protects against abuse, DDoS, and cost overrun. Algorithms: fixed window, sliding window, token bucket.
- **Throttling**: Slowing or queuing requests when the system is under load (backpressure).

### When to Use

- All public or partner-facing APIs. Also consider for login and sensitive endpoints (e.g., password reset).

### Trade-offs

| Pros | Cons |
|------|------|
| Prevents abuse and improves fairness | Need consistent limits across replicas (e.g., Redis) |
| Protects backend and costs | Choosing limits and keys (user vs IP) is product decision |
| | Can block legitimate traffic if misconfigured |

---

## 11. CORS and Security Headers

### Concept

- **CORS**: Browser mechanism. Server returns `Access-Control-Allow-Origin` (and related headers) to allow a frontend on another origin to call the API. Prevents arbitrary sites from reading responses; misconfiguration can leak data.
- **Security headers**: e.g. `Content-Security-Policy`, `X-Content-Type-Options`, `Strict-Transport-Security` (HSTS), `X-Frame-Options` to mitigate XSS, clickjacking, and protocol downgrade.

### When to Use

- Any API consumed by browser clients on a different origin (CORS). All web responses should set a baseline of security headers.

### Trade-offs

| Pros | Cons |
|------|------|
| Enables secure cross-origin frontends | Overly permissive CORS undermines security |
| Reduces XSS/clickjacking surface | CSP can break inline scripts; needs tuning |
| | HSTS requires valid HTTPS and commitment |

---

## 12. Secrets Management

### Concept

- **Secrets**: API keys, DB passwords, signing keys, etc. Never hardcode; store in a **secrets manager** (e.g., HashiCorp Vault, AWS Secrets Manager, GCP Secret Manager). Apps fetch at startup or via sidecar; rotate regularly. Use least privilege (IAM) for access to secrets.

### When to Use

- Any production system. Critical in cloud and microservices so each service gets only the secrets it needs.

### Trade-offs

| Pros | Cons |
|------|------|
| No secrets in code or config in repo | Dependency on secrets service availability |
| Audit and rotation in one place | Bootstrapping (how does the app auth to the manager?) |
| | Latency and caching of secrets in app |

---

## 13. Zero Trust and Least Privilege

### Concept

- **Zero trust**: Don’t assume “inside the network” means trusted. Verify every request (identity + context); segment and limit access.
- **Least privilege**: Grant only the minimum permissions needed for a role or service. Reduces blast radius of compromise.

### When to Use

- Modern and cloud-native design; especially for sensitive data and multi-tenant systems.

### Trade-offs

| Pros | Cons |
|------|------|
| Limits impact of breach | More granular IAM and policy to maintain |
| Aligns with compliance and audits | Operational overhead |
| | Can complicate debugging and operations |

---

## Strategy Selection (Quick Reference)

| Scenario | Prefer |
|----------|--------|
| Web app, need simple logout/revoke | Session-based auth |
| APIs, microservices, no shared session | JWT (short-lived) + refresh |
| “Login with Google” / third-party access | OAuth 2.0 + OIDC |
| Machine-to-machine | API keys or OAuth2 Client Credentials |
| Coarse permissions by job function | RBAC |
| Fine-grained or context-based rules | ABAC |
| Public or partner API | Rate limiting + API key or OAuth |
| Compliance / sensitive data | Encryption at rest + in transit, secrets manager |

---

## Interview Tips

1. **Clarify**: Who are the users (humans vs services)? What data is sensitive? Compliance?
2. **Draw**: Auth flow (login → token/session → API → validation). Where are secrets?
3. **Mention**: HTTPS, hashing for passwords, no secrets in code, rate limiting, CORS/headers.
4. **Trade-offs**: Stateless vs stateful auth; RBAC vs ABAC; complexity vs security.
5. **Failure**: Token theft, key leak, session fixation — how do you detect and mitigate?

---

## Related Python Examples

Each topic has a corresponding Python placeholder in this directory:

- `01_authentication_basics.py`
- `02_oauth2_oidc.py`
- `03_jwt.py`
- `04_session_based_auth.py`
- `05_api_keys_service_auth.py`
- `06_rbac.py`
- `07_abac.py`
- `08_encryption.py`
- `09_hashing_password_storage.py`
- `10_rate_limiting.py`
- `11_cors_security_headers.py`
- `12_secrets_management.py`
- `13_zero_trust_least_privilege.py`

Add implementation code to each file as needed.
