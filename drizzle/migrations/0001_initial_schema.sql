-- Specwright Phase 2: Core Engine Migration
-- Migration 0001: Add organisations, context_sources, context_chunks, audit_log

CREATE EXTENSION IF NOT EXISTS vector;

-- ─── ORGANISATIONS ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS organisations (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name        TEXT NOT NULL,
  slug        TEXT UNIQUE NOT NULL,
  plan        TEXT NOT NULL DEFAULT 'free',
  status      TEXT NOT NULL DEFAULT 'active',
  settings    JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_organisations_slug   ON organisations(slug);
CREATE INDEX IF NOT EXISTS idx_organisations_status ON organisations(status);

-- ─── CONTEXT SOURCES ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS context_sources (
  id                TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  org_id            TEXT REFERENCES organisations(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  source_type       TEXT NOT NULL,
  config            JSONB NOT NULL DEFAULT '{}',
  credibility_score FLOAT NOT NULL DEFAULT 0.8,
  is_active         BOOLEAN NOT NULL DEFAULT true,
  last_synced_at    TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_context_sources_org    ON context_sources(org_id);
CREATE INDEX IF NOT EXISTS idx_context_sources_type   ON context_sources(source_type);
CREATE INDEX IF NOT EXISTS idx_context_sources_active ON context_sources(is_active) WHERE is_active = true;

-- ─── CONTEXT CHUNKS ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS context_chunks (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  org_id      TEXT REFERENCES organisations(id) ON DELETE CASCADE,
  source_id   TEXT REFERENCES context_sources(id) ON DELETE SET NULL,
  feature_id  TEXT REFERENCES features(id) ON DELETE SET NULL,
  source_type TEXT NOT NULL,
  chunk_type  TEXT NOT NULL DEFAULT 'paragraph',
  content     TEXT NOT NULL,
  embedding   VECTOR(1536),
  metadata    JSONB NOT NULL DEFAULT '{}',
  source_ts   TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_context_chunks_embedding
  ON context_chunks USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

CREATE INDEX IF NOT EXISTS idx_context_chunks_org     ON context_chunks(org_id);
CREATE INDEX IF NOT EXISTS idx_context_chunks_source  ON context_chunks(source_id);
CREATE INDEX IF NOT EXISTS idx_context_chunks_feature ON context_chunks(feature_id);
CREATE INDEX IF NOT EXISTS idx_context_chunks_ts      ON context_chunks(source_ts DESC NULLS LAST);

-- ─── EXTEND SPECS TABLE ──────────────────────────────────────────────────────
ALTER TABLE specs
  ADD COLUMN IF NOT EXISTS org_id       TEXT REFERENCES organisations(id),
  ADD COLUMN IF NOT EXISTS title        TEXT,
  ADD COLUMN IF NOT EXISTS status       TEXT NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS approved_by  TEXT,
  ADD COLUMN IF NOT EXISTS approved_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS content_hash TEXT,
  ADD COLUMN IF NOT EXISTS locked_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_specs_status ON specs(status);
CREATE INDEX IF NOT EXISTS idx_specs_org    ON specs(org_id);

-- ─── AUDIT LOG ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_log (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  org_id      TEXT REFERENCES organisations(id),
  spec_id     TEXT REFERENCES specs(id) ON DELETE SET NULL,
  agent_name  TEXT NOT NULL,
  action      TEXT NOT NULL,
  reasoning   TEXT,
  details     JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_spec  ON audit_log(spec_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_org   ON audit_log(org_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_ts    ON audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_agent ON audit_log(agent_name);
