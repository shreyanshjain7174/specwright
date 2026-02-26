# Changelog

All notable changes to Specwright are documented in this file.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).  
Versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] — 2026-02-27

### 🎉 Initial Production Release

Specwright v1.0.0 is the first production-ready release. Built overnight in a single 9-phase session.

### Added

#### Core Engine
- **Multi-agent spec generation** using ReAct orchestration pattern
  - `ContextHarvester` — Semantic retrieval from ingested context
  - `SpecDraft` — Generates 4-layer Executable Specifications
  - `ConstraintExtractor` — Derives DO NOT rules from context
  - `GherkinWriter` — Produces Given/When/Then acceptance tests
  - `AdversaryReview` — Adversarially challenges generated specs
- **Pre-code simulation engine** with 4 validators:
  - Completeness checker (detects missing requirements)
  - Ambiguity detector (flags unclear language)
  - Contradiction finder (identifies conflicting constraints)
  - Testability validator (ensures Gherkin coverage)
- **4-layer Executable Specifications** with full traceability:
  - Narrative Layer (human-readable intent)
  - Context Pointer Layer (evidence URIs with source citations)
  - Constraint Layer (explicit DO NOT rules + severity levels)
  - Verification Layer (Gherkin Given/When/Then tests)
- **Immutable spec approval** — SHA-256 hash + append-only audit trail
- **3-format export** — Markdown, JSON, Gherkin

#### Data & Storage
- Neon PostgreSQL integration with pgvector (1536D embeddings)
- Hybrid context retrieval (vector similarity + time-decay + source credibility)
- Semantic chunking (preserves conversation turns + paragraph boundaries)
- Multi-source ingestion (Slack, Jira, Notion, GitHub, transcripts, manual input)
- Memgraph integration for feature→spec→context traceability graphs

#### MCP Server (Dual Transport)
- STDIO transport for Claude Desktop + Claude CLI
- HTTP transport for Cursor web integration
- 6 MCP tools:
  - `fetch_spec` — Retrieve complete 4-layer spec
  - `ingest_context` — Add raw context from any source
  - `generate_spec` — Trigger async spec generation
  - `list_features` — Browse and filter features
  - `get_constraints` — Quick constraint lookup
  - `run_simulation` — Pre-code validation

#### Frontend (Next.js 15)
- Landing page with hero, before/after narrative, and CTA
- Interactive demo with streaming spec generation + real-time export
- Feature dashboard with search, filter, and status badges
- Feature detail page with full spec view, traceability graph, approve/regenerate
- Multi-step context ingestion form with preview

#### API Routes
- `POST /api/context/ingest` — Multi-source context ingestion
- `GET /api/context/search` — Hybrid search
- `GET /api/features` — List features with spec status
- `POST /api/features` — Create feature
- `POST /api/specs/generate` — Streaming spec generation
- `POST /api/specs/simulate` — Pre-code simulation
- `POST /api/specs/approve` — Immutable spec locking
- `GET /api/specs/[id]/export` — 3-format export
- `GET /api/health` — System health check

#### Quality & Testing
- **169 tests** across 6 test files (unit + integration)
- **91.4% coverage** on core engine modules
- TypeScript strict mode throughout (zero `any` in core)
- Error boundaries on all pages
- Audit logging for compliance

#### Developer Experience
- GitHub Actions CI (build + lint + type-check + test)
- Vercel deployment pipeline
- Complete environment variable documentation
- MCP integration guides (Claude Desktop + Cursor)
- Production deployment guide (DEPLOYMENT.md)

---

## [Unreleased] — v2.0+

### Planned
- Live collaboration (multi-user spec editing)
- Slack/Jira webhook ingestion (auto-sync context)
- Linear/GitHub integration (auto-create issues from approved specs)
- Vector search UI (explore context by similarity)
- Spec versioning UI (diff between v1 → v2)
- Custom LLM routing (use customer's own API key)
- Agent-to-agent protocol (A2A delegation between teams)
- Enterprise SSO (SAML/OAuth)
- Data residency options (EU, US regions)

---

*Built with 💜 overnight by Shreyansh Sancheti + AI agents (Feb 2026)*
