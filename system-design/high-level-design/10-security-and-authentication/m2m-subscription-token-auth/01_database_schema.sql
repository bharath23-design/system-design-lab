-- =============================================================================
-- M2M Token Auth — Database Schema
-- =============================================================================
-- Three tables:
--   clients       → B2B customers (the M2M consumers)
--   subscriptions → their active plan + expiry date (drives token TTL)
--   issued_tokens → audit trail + revocation support
-- =============================================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- Table: clients
-- Represents each B2B tenant / machine client
-- -----------------------------------------------------------------------------
CREATE TABLE clients (
    client_id       UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    client_secret   TEXT        NOT NULL,           -- bcrypt-hashed, never plaintext
    name            TEXT        NOT NULL,
    is_active       BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Lookup by client_id is the primary access pattern
CREATE INDEX idx_clients_client_id ON clients (client_id);


-- -----------------------------------------------------------------------------
-- Table: subscriptions
-- One active subscription per client at any time.
-- expires_at is THE source of truth for token TTL.
-- -----------------------------------------------------------------------------
CREATE TABLE subscriptions (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id       UUID        NOT NULL REFERENCES clients (client_id) ON DELETE CASCADE,
    plan            TEXT        NOT NULL CHECK (plan IN ('monthly', 'quarterly', 'yearly')),
    starts_at       TIMESTAMPTZ NOT NULL,
    expires_at      TIMESTAMPTZ NOT NULL,           -- token exp is set to this value
    is_active       BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Fast lookup: "give me the active subscription for client X"
CREATE INDEX idx_subscriptions_client_active
    ON subscriptions (client_id, is_active)
    WHERE is_active = TRUE;

-- For the daily cron: "which subscriptions expire in the next N days?"
CREATE INDEX idx_subscriptions_expires_at ON subscriptions (expires_at);


-- -----------------------------------------------------------------------------
-- Table: issued_tokens
-- Every token issuance is recorded here (audit trail + revocation list).
-- jti (JWT ID) is the primary key — unique per token.
-- -----------------------------------------------------------------------------
CREATE TABLE issued_tokens (
    jti             UUID        PRIMARY KEY,        -- matches JWT "jti" claim
    client_id       UUID        NOT NULL REFERENCES clients (client_id),
    issued_at       TIMESTAMPTZ NOT NULL,
    expires_at      TIMESTAMPTZ NOT NULL,
    revoked         BOOLEAN     NOT NULL DEFAULT FALSE,
    revoked_at      TIMESTAMPTZ,                    -- NULL unless actively revoked
    revoke_reason   TEXT                            -- 'cancellation', 'renewal', 'rotation', etc.
);

-- Fast revocation check per token
CREATE INDEX idx_issued_tokens_jti ON issued_tokens (jti);

-- Revoke all tokens for a client (used on cancellation/renewal)
CREATE INDEX idx_issued_tokens_client_active
    ON issued_tokens (client_id, revoked)
    WHERE revoked = FALSE;


-- =============================================================================
-- Helper views
-- =============================================================================

-- Active subscriptions with client info — used by auth server on token issuance
CREATE VIEW v_active_subscriptions AS
SELECT
    c.client_id,
    c.name          AS client_name,
    c.is_active     AS client_active,
    s.id            AS subscription_id,
    s.plan,
    s.starts_at,
    s.expires_at,
    EXTRACT(EPOCH FROM (s.expires_at - NOW()))::BIGINT AS seconds_remaining
FROM clients c
JOIN subscriptions s
    ON s.client_id  = c.client_id
   AND s.is_active  = TRUE
   AND s.expires_at > NOW()
WHERE c.is_active = TRUE;


-- Subscriptions expiring within the next 7 days — for renewal reminders
CREATE VIEW v_expiring_soon AS
SELECT
    client_id,
    plan,
    expires_at,
    EXTRACT(EPOCH FROM (expires_at - NOW()))::BIGINT AS seconds_remaining
FROM subscriptions
WHERE is_active   = TRUE
  AND expires_at  > NOW()
  AND expires_at <= NOW() + INTERVAL '7 days';


-- =============================================================================
-- Sample seed data (for local dev / testing)
-- =============================================================================

INSERT INTO clients (client_id, client_secret, name) VALUES
    ('11111111-0000-0000-0000-000000000001',
     '$2b$12$examplehashfordevonly',          -- bcrypt("dev-secret-yearly")
     'Acme Corp'),
    ('22222222-0000-0000-0000-000000000002',
     '$2b$12$examplehashfordevonly2',         -- bcrypt("dev-secret-monthly")
     'Globex Inc');

INSERT INTO subscriptions (client_id, plan, starts_at, expires_at) VALUES
    ('11111111-0000-0000-0000-000000000001',
     'yearly',
     NOW(),
     NOW() + INTERVAL '1 year'),
    ('22222222-0000-0000-0000-000000000002',
     'monthly',
     NOW(),
     NOW() + INTERVAL '1 month');
