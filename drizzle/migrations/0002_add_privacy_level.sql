-- Specwright Phase 7: Security & Privacy Migration
-- Migration 0002: Add privacy_level to context_chunks + quality scores to specs

-- ─── CONTEXT CHUNKS: PRIVACY CLASSIFICATION ──────────────────────────────────

ALTER TABLE context_chunks
  ADD COLUMN IF NOT EXISTS privacy_level TEXT NOT NULL DEFAULT 'internal'
    CHECK (privacy_level IN ('public', 'internal', 'confidential'));

-- Index for fast privacy-filtered queries (e.g., MCP export excludes confidential)
CREATE INDEX IF NOT EXISTS idx_context_chunks_privacy
  ON context_chunks(org_id, privacy_level);

COMMENT ON COLUMN context_chunks.privacy_level IS
  'Data classification: public (shareable), internal (org-only), confidential (restricted — excluded from MCP exports unless explicitly unlocked)';

-- ─── SPECS: QUALITY SCORE COLUMNS ────────────────────────────────────────────

ALTER TABLE specs
  ADD COLUMN IF NOT EXISTS completeness_score  FLOAT,
  ADD COLUMN IF NOT EXISTS grounding_score     FLOAT,
  ADD COLUMN IF NOT EXISTS testability_score   FLOAT,
  ADD COLUMN IF NOT EXISTS adversarial_score   FLOAT,
  ADD COLUMN IF NOT EXISTS overall_score       FLOAT;

COMMENT ON COLUMN specs.completeness_score  IS 'Structural completeness: 0-100';
COMMENT ON COLUMN specs.grounding_score     IS 'Context citation coverage: 0-100 (% with source + snippet)';
COMMENT ON COLUMN specs.testability_score   IS 'Gherkin completeness: 0-100 (% with full Given/When/Then)';
COMMENT ON COLUMN specs.adversarial_score   IS 'Adversary review quality: 0-100 (100 = no issues found)';
COMMENT ON COLUMN specs.overall_score       IS 'Weighted average of all four quality dimensions: 0-100';

-- Index for leaderboard-style queries and quality filtering
CREATE INDEX IF NOT EXISTS idx_specs_overall_score
  ON specs(org_id, overall_score DESC NULLS LAST)
  WHERE overall_score IS NOT NULL;

-- ─── AUDIT LOG: SESSION INDEX ─────────────────────────────────────────────────
-- Support fast trajectory lookups by session_id stored in details JSONB

CREATE INDEX IF NOT EXISTS idx_audit_log_session_id
  ON audit_log ((details->>'session_id'))
  WHERE action = 'trajectory.complete';
