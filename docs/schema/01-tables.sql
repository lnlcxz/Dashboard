-- Dashboard Open Finance — DDL v1.0 (Plano Consolidado)
-- Ordem de criação respeitando FKs. Executar após extensões: gen_random_uuid, etc.

-- 1. tb_users
CREATE TABLE tb_users (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email              TEXT UNIQUE NOT NULL,
  full_name          TEXT NOT NULL,
  avatar_url         TEXT,
  mfa_enabled        BOOLEAN DEFAULT false,
  mfa_secret         TEXT,
  locale             VARCHAR(10) DEFAULT 'pt-BR',
  timezone           VARCHAR(50) DEFAULT 'America/Sao_Paulo',
  notification_prefs JSONB DEFAULT '{"email": true, "push": false}',
  last_login_at      TIMESTAMPTZ,
  failed_login_count INTEGER DEFAULT 0,
  locked_until       TIMESTAMPTZ,
  role               VARCHAR(20) DEFAULT 'user',
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW(),
  deleted_at         TIMESTAMPTZ
);
CREATE INDEX idx_users_email ON tb_users(email) WHERE deleted_at IS NULL;

-- 2. tb_audit_log (sem soft delete)
CREATE TABLE tb_audit_log (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID REFERENCES tb_users(id),
  action         VARCHAR(100) NOT NULL,
  resource_type  VARCHAR(50),
  resource_id    UUID,
  ip_address     INET,
  user_agent     TEXT,
  metadata       JSONB,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_audit_user_id ON tb_audit_log(user_id);
CREATE INDEX idx_audit_action ON tb_audit_log(action);
CREATE INDEX idx_audit_created_at ON tb_audit_log(created_at DESC);

-- 3. tb_institutions
CREATE TABLE tb_institutions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name           VARCHAR(100) NOT NULL,
  slug           VARCHAR(50) UNIQUE NOT NULL,
  ispb           VARCHAR(8),
  logo_url       TEXT,
  color_primary  VARCHAR(7),
  adapter_class  VARCHAR(200),
  api_base_url   TEXT,
  participant_id VARCHAR(50),
  supports_mtls  BOOLEAN DEFAULT true,
  is_active      BOOLEAN DEFAULT true,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_institutions_slug ON tb_institutions(slug);
CREATE INDEX idx_institutions_is_active ON tb_institutions(is_active);

-- 4. tb_connections
CREATE TABLE tb_connections (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID REFERENCES tb_users(id) NOT NULL,
  institution_id     UUID REFERENCES tb_institutions(id) NOT NULL,
  access_token       TEXT NOT NULL,
  refresh_token      TEXT,
  iv                 TEXT NOT NULL,
  scope              TEXT[],
  token_expires_at   TIMESTAMPTZ,
  refresh_expires_at TIMESTAMPTZ,
  consent_id         TEXT,
  consent_expires_at TIMESTAMPTZ,
  sync_status        VARCHAR(20) DEFAULT 'active',
  last_synced_at     TIMESTAMPTZ,
  sync_error_count   INTEGER DEFAULT 0,
  last_error_message TEXT,
  webhook_url        TEXT,
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW(),
  deleted_at         TIMESTAMPTZ
);
CREATE INDEX idx_connections_user_id ON tb_connections(user_id) WHERE deleted_at IS NULL;

-- 5. tb_accounts
CREATE TABLE tb_accounts (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id      UUID REFERENCES tb_connections(id) NOT NULL,
  user_id            UUID REFERENCES tb_users(id) NOT NULL,
  external_id        TEXT NOT NULL,
  account_type       VARCHAR(50) NOT NULL,
  account_number     TEXT,
  agency             TEXT,
  name               TEXT NOT NULL,
  currency           VARCHAR(3) DEFAULT 'BRL',
  balance            BIGINT DEFAULT 0,
  available_balance  BIGINT DEFAULT 0,
  sync_status        VARCHAR(20) DEFAULT 'active',
  last_synced_at     TIMESTAMPTZ,
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW(),
  deleted_at         TIMESTAMPTZ,
  CONSTRAINT unique_external_account UNIQUE (connection_id, external_id)
);

-- 6. tb_sync_log
CREATE TABLE tb_sync_log (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id       UUID REFERENCES tb_connections(id) NOT NULL,
  status              VARCHAR(20) NOT NULL,
  started_at          TIMESTAMPTZ NOT NULL,
  finished_at         TIMESTAMPTZ,
  duration_ms         INTEGER,
  accounts_synced     INTEGER DEFAULT 0,
  transactions_synced INTEGER DEFAULT 0,
  error_message       TEXT,
  error_stack         TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- 7. tb_categories (antes de tb_transactions)
CREATE TABLE tb_categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id   UUID REFERENCES tb_categories(id),
  name        TEXT NOT NULL,
  slug        VARCHAR(100) NOT NULL,
  icon        TEXT,
  color       VARCHAR(7),
  type        VARCHAR(20) NOT NULL,
  is_system   BOOLEAN DEFAULT false,
  user_id     UUID REFERENCES tb_users(id),
  sort_order  INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ
);

-- 8. tb_transactions
CREATE TABLE tb_transactions (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id         UUID REFERENCES tb_accounts(id) NOT NULL,
  user_id            UUID REFERENCES tb_users(id) NOT NULL,
  id_banco_origem    TEXT NOT NULL,
  date               TIMESTAMPTZ NOT NULL,
  amount             BIGINT NOT NULL,
  currency           VARCHAR(3) DEFAULT 'BRL',
  description        TEXT NOT NULL,
  description_raw    TEXT,
  merchant_name      TEXT,
  merchant_cnpj      TEXT,
  transaction_type   VARCHAR(20) NOT NULL,
  status             VARCHAR(20) NOT NULL DEFAULT 'settled',
  category_id        UUID REFERENCES tb_categories(id),
  counterpart_id     UUID REFERENCES tb_transactions(id),
  is_recurring       BOOLEAN DEFAULT false,
  recurring_period   VARCHAR(20),
  recurring_group_id UUID,
  tags               TEXT[],
  notes              TEXT,
  attachments        TEXT[],
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW(),
  deleted_at         TIMESTAMPTZ,
  CONSTRAINT unique_transaction_origin UNIQUE (account_id, id_banco_origem)
);
CREATE INDEX idx_transactions_account_date ON tb_transactions(account_id, date DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_transactions_user_category ON tb_transactions(user_id, category_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_transactions_description_fts ON tb_transactions USING gin(to_tsvector('portuguese', description));

-- 9. tb_rules
CREATE TABLE tb_rules (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES tb_users(id) NOT NULL,
  category_id  UUID REFERENCES tb_categories(id) NOT NULL,
  pattern      TEXT NOT NULL,
  match_type   VARCHAR(20) DEFAULT 'contains',
  priority     INTEGER DEFAULT 0,
  is_active    BOOLEAN DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  deleted_at   TIMESTAMPTZ
);

-- 10. tb_budgets
CREATE TABLE tb_budgets (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES tb_users(id) NOT NULL,
  category_id   UUID REFERENCES tb_categories(id),
  period_type   VARCHAR(10) NOT NULL,
  start_date    DATE NOT NULL,
  end_date      DATE,
  amount        BIGINT NOT NULL,
  alert_at_pct  INTEGER DEFAULT 80,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  deleted_at    TIMESTAMPTZ
);

-- 11. tb_recurring_groups
CREATE TABLE tb_recurring_groups (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID REFERENCES tb_users(id) NOT NULL,
  name             TEXT NOT NULL,
  merchant_name    TEXT,
  merchant_cnpj    TEXT,
  period           VARCHAR(20) NOT NULL,
  average_amount   BIGINT NOT NULL,
  first_occurrence TIMESTAMPTZ NOT NULL,
  last_occurrence  TIMESTAMPTZ,
  next_expected    TIMESTAMPTZ,
  is_active        BOOLEAN DEFAULT true,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  deleted_at       TIMESTAMPTZ
);

-- 12. tb_forecast_snapshots
CREATE TABLE tb_forecast_snapshots (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID REFERENCES tb_users(id) NOT NULL,
  forecast_date     DATE NOT NULL,
  horizon_days      INTEGER NOT NULL,
  projected_balance BIGINT NOT NULL,
  projected_income  BIGINT NOT NULL,
  projected_expense BIGINT NOT NULL,
  confidence_score  NUMERIC(3,2),
  algorithm_version VARCHAR(20) DEFAULT 'v1',
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- 13. tb_notifications
CREATE TABLE tb_notifications (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES tb_users(id) NOT NULL,
  type         VARCHAR(50) NOT NULL,
  title        TEXT NOT NULL,
  message      TEXT NOT NULL,
  action_url   TEXT,
  action_label TEXT,
  metadata     JSONB,
  is_read      BOOLEAN DEFAULT false,
  read_at      TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  deleted_at   TIMESTAMPTZ
);

-- Pendência Épico 2: idempotência de webhooks
CREATE TABLE tb_webhook_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id  UUID REFERENCES tb_institutions(id) NOT NULL,
  webhook_event_id TEXT NOT NULL,
  payload_hash    TEXT,
  processed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_webhook_event UNIQUE (institution_id, webhook_event_id)
);
