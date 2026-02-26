# Specwright — Executable Specs for AI Coding Agents

[![CI](https://github.com/shreyanshjain7174/specwright/actions/workflows/ci.yml/badge.svg)](https://github.com/shreyanshjain7174/specwright/actions/workflows/ci.yml)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/import/project?template=https://github.com/shreyanshjain7174/specwright)
[![Version](https://img.shields.io/badge/version-1.0.0-blue)](CHANGELOG.md)
[![Tests](https://img.shields.io/badge/tests-169%20passing-brightgreen)](tests/)
[![Coverage](https://img.shields.io/badge/coverage-91.4%25-brightgreen)](coverage/)

---

## 30-Second Pitch

**The problem:** AI coding tools (Cursor, Windsurf, Claude Code) made writing code nearly free. The bottleneck shifted upstream — to *defining what to build*. PMs write vague PRDs. Context lives in Slack, Jira, Gong, Notion. AI agents get low-fidelity instructions and build *productively wrong* features.

**Specwright fixes this.** It automatically harvests context from every source, grounds every requirement in real evidence, simulates the feature before any code is written, and locks the spec with a SHA-256 hash for auditability.

> **"Cursor for Product Management"** — turn chaos into machine-readable specs that AI agents can implement without hallucinating.

---

## How Specwright Beats ChatPRD

| Capability | ChatPRD / Notion AI | **Specwright** |
|-----------|-------------------|----------------|
| **Context automation** | You paste context manually | Auto-ingests Slack, Jira, Notion, GitHub, transcripts |
| **Evidence grounding** | LLM generates requirements from memory | Every requirement cites its source (quote + timestamp + URL) |
| **Adversarial review** | No pre-validation | Simulates feature before code: catches ambiguity, gaps, contradictions |
| **Immutable specs** | Docs can be silently edited | SHA-256 hash + append-only audit trail |
| **AI agent readiness** | Markdown export only | 4-layer Executable Spec (Gherkin + constraints + pointers) |
| **MCP integration** | None | Native STDIO + HTTP transport for Claude Desktop + Cursor |

### The Four Differentiators

**🔍 Context Automation (Multi-Source Ingestion)**  
Specwright ingests context from Slack threads, Jira tickets, Notion pages, GitHub PRs, customer call transcripts, and manual input — then semantically chunks and indexes it with time-decay weighting.

**📎 Evidence Grounding (Every Requirement Cites Its Source)**  
Every requirement in a generated spec includes a Context Pointer: the exact quote, source URL, and timestamp it came from. No hallucinations. No "trust me" requirements.

**⚔️ Adversarial Review (Simulation Before Code)**  
Before code is written, Specwright runs 4 validators: completeness checker, ambiguity detector, contradiction finder, and testability validator. The AdversaryReview agent actively challenges the spec looking for weaknesses.

**🔐 Immutable Specs (SHA-256 Hash + Audit Trail)**  
Once approved, a spec is locked with a SHA-256 hash and recorded in an append-only audit log. Changes require a new version. Built for compliance-conscious teams.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│               Next.js Web Platform                      │
│  Landing Page • Demo • Dashboard • Ingest Form          │
└────────────┬──────────────────────┬────────────────────┘
             │                      │
             │ User Interface       │ REST API
             │                      │
     ┌───────▼──────┐       ┌──────▼─────────────┐
     │  TailwindCSS │       │ Neon PostgreSQL    │
     │  React 19    │       │ + pgvector (1536D) │
     │  Lucide      │       │                    │
     └──────────────┘       └────────┬───────────┘
                                     │
                    ┌────────────────┼────────────────┐
                    │                │                │
         ┌──────────▼──────┐  ┌──────▼──────┐  ┌────▼─────────┐
         │ Memgraph Graph  │  │ Qdrant      │  │ Audit Trail  │
         │ (traceability)  │  │ (embeddings)│  │ (compliance) │
         └─────────────────┘  └─────────────┘  └──────────────┘
                                     │
                    ┌────────────────▼────────────────┐
                    │  Multi-Agent Orchestrator       │
                    │  (ReAct Pattern)                │
                    │                                 │
                    │  • ContextHarvester             │
                    │  • SpecDraft                    │
                    │  • ConstraintExtractor          │
                    │  • GherkinWriter                │
                    │  • AdversaryReview              │
                    └────────────────┬────────────────┘
                                     │
                    ┌────────────────▼────────────────┐
                    │  Pre-Code Simulator             │
                    │  • Completeness checker         │
                    │  • Ambiguity detector           │
                    │  • Contradiction finder         │
                    │  • Testability validator        │
                    └────────────────┬────────────────┘
                                     │
                    ┌────────────────▼────────────────┐
                    │  MCP Server (Dual Transport)    │
                    │  • STDIO (Claude Desktop/CLI)   │
                    │  • HTTP (Cursor Web)            │
                    │                                 │
                    │  Tools:                         │
                    │  1. fetch_spec                  │
                    │  2. ingest_context              │
                    │  3. generate_spec               │
                    │  4. list_features               │
                    │  5. get_constraints             │
                    │  6. run_simulation              │
                    └─────────────────────────────────┘
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 15, React 19, TailwindCSS, Lucide icons |
| **Backend** | Node.js 20+, TypeScript (strict mode) |
| **Database** | Neon PostgreSQL + pgvector (1536D) |
| **Graph DB** | Memgraph (traceability relationships) |
| **Vector DB** | Qdrant (semantic embeddings) |
| **AI** | Cloudflare Workers AI (embeddings + inference) |
| **MCP** | Model Context Protocol (STDIO + HTTP) |
| **Deployment** | Vercel (frontend + API routes) |

---

## Quick Start

### Prerequisites

- Node.js 20+
- npm
- [Neon PostgreSQL](https://neon.tech) account (free tier)
- [Qdrant](https://cloud.qdrant.io) account (free tier) or local Docker

### 1. Clone & Install

```bash
git clone https://github.com/shreyanshjain7174/specwright.git
cd specwright
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```bash
# Required
DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/specwright?sslmode=require
QDRANT_URI=https://your-cluster.aws.cloud.qdrant.io:6333
QDRANT_API_KEY=your-qdrant-api-key

# Recommended (for AI features)
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_API_TOKEN=your-api-token
```

### 3. Run Migrations

```bash
npx drizzle-kit push
```

### 4. Start Development Server

```bash
npm run dev
```

App runs at **http://localhost:3000**

### 5. Verify Installation

```bash
curl http://localhost:3000/api/health
# Should return: { "status": "healthy", ... }
```

---

## MCP Integration

### Claude Desktop (STDIO Mode)

Add to `~/.claude/settings.json`:

```json
{
  "mcpServers": {
    "specwright": {
      "command": "npm",
      "args": ["run", "mcp"],
      "cwd": "/absolute/path/to/specwright",
      "env": {
        "DATABASE_URL": "your-neon-url",
        "QDRANT_URI": "your-qdrant-uri",
        "QDRANT_API_KEY": "your-qdrant-key"
      }
    }
  }
}
```

Restart Claude Desktop. You'll see **Specwright** in the tool menu.

**Example usage in Claude:**
```
@specwright fetch_spec user-authentication
@specwright list_features status:approved
@specwright run_simulation spec-abc123
```

### Cursor (HTTP Mode)

```bash
# Start MCP server in HTTP mode
MCP_SERVER_MODE=http MCP_HTTP_PORT=3001 npm run mcp
```

In Cursor settings, add MCP server URL: `http://localhost:3001`

**API endpoints:**
```bash
# Get server manifest (tool definitions)
curl http://localhost:3001/mcp/manifest

# Call a tool
curl -X POST http://localhost:3001/mcp/call \
  -H "Content-Type: application/json" \
  -d '{"tool_name": "fetch_spec", "arguments": {"feature_name": "dark-mode"}}'
```

### Available MCP Tools

| Tool | Description | Input |
|------|-------------|-------|
| `fetch_spec` | Get complete 4-layer Executable Spec | `{ feature_name: string }` |
| `ingest_context` | Add raw context from any source | `{ source_type, content, feature_name, source_url? }` |
| `generate_spec` | Trigger spec generation pipeline | `{ feature_name, description? }` |
| `list_features` | Browse and filter features | `{ search?, status? }` |
| `get_constraints` | Quick DO NOT rules lookup | `{ feature_name: string }` |
| `run_simulation` | Pre-code validation | `{ spec_id: string }` |

---

## API Reference

### Context Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/context/ingest` | Ingest raw input (Slack, Jira, transcript, etc.) |
| `GET` | `/api/context/search` | Hybrid search (vector + time-decay + source filtering) |

### Spec Generation

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/features` | List all features with spec status |
| `POST` | `/api/features` | Create new feature |
| `POST` | `/api/specs/generate` | Trigger spec generation (streaming) |
| `POST` | `/api/specs/simulate` | Run pre-code validation |
| `POST` | `/api/specs/approve` | Lock spec (SHA-256 hash + audit log) |
| `GET` | `/api/specs/[id]/export?format=markdown\|json\|gherkin` | Export in 3 formats |

### Health & Meta

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | System health check |
| `GET` | `/mcp/manifest` | MCP tool definitions |

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | Neon PostgreSQL connection string |
| `QDRANT_URI` | ✅ | Qdrant vector database URL |
| `QDRANT_API_KEY` | ✅ | Qdrant API key (cloud) |
| `CLOUDFLARE_ACCOUNT_ID` | ⚡ | Cloudflare account ID (for AI) |
| `CLOUDFLARE_API_TOKEN` | ⚡ | Cloudflare API token (for AI) |
| `MEMGRAPH_URI` | 💡 | Memgraph graph DB URI |
| `MEMGRAPH_USERNAME` | 💡 | Memgraph username |
| `MEMGRAPH_PASSWORD` | 💡 | Memgraph password |
| `MCP_SERVER_MODE` | 💡 | `stdio` (default) or `http` |
| `MCP_HTTP_PORT` | 💡 | HTTP port (default: `3001`) |
| `NEXT_PUBLIC_APP_URL` | 💡 | Public app URL |

> ✅ Required · ⚡ Recommended · 💡 Optional

See `.env.example` for full documentation with examples.

---

## Testing

```bash
# Run all tests
npm test

# Run with coverage report
npm run test:coverage

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration

# Watch mode
npm run test:watch
```

**Test suite:** 169 tests across 6 files · 91.4% coverage on core modules

| Test File | Tests | Coverage |
|-----------|-------|----------|
| `tests/unit/ingestion.test.ts` | 39 | Parsing, chunking, embedding |
| `tests/unit/simulator.test.ts` | 34 | All 4 validators |
| `tests/unit/spec-compiler.test.ts` | 33 | 4-layer spec compilation |
| `tests/unit/agents.test.ts` | 28 | ReAct agent orchestration |
| `tests/integration/api.test.ts` | 14 | REST API endpoints |
| `tests/integration/mcp.test.ts` | 21 | All 6 MCP tools |

---

## Database Schema

| Table | Purpose | Key Columns |
|-------|---------|------------|
| `organisations` | Multi-tenant isolation | id, name, slug, created_at |
| `features` | Product features | id, name, description, org_id |
| `context_sources` | Raw ingested input | id, source_type, content, embedding (vector), feature_id |
| `specs` | Executable specifications | id, feature_id, version, status, narrative, constraints, gherkin_tests, hash |
| `audit_log` | Compliance trail | id, action, entity_type, entity_id, payload, created_at |

---

## Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page (hero + before/after narrative) |
| `/demo` | Interactive spec generator (streaming UI + export) |
| `/dashboard` | Feature list with status badges + search |
| `/dashboard/features/[id]` | Feature detail + traceability graph + approve |
| `/dashboard/ingest` | Multi-step context ingestion form |

---

## Deployment

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for the complete Vercel deployment guide.

```bash
# One-command deploy
vercel --prod
```

---

## Features Checklist (v1.0.0)

### Core Engine
- ✅ Semantic chunking (preserves conversation turns + paragraph boundaries)
- ✅ Multi-source ingestion (Slack, Jira, Notion, GitHub, transcripts, manual)
- ✅ Hybrid context retrieval (vector similarity + time-decay + source credibility)
- ✅ Multi-agent spec generation (ReAct orchestration, 5 specialized agents)
- ✅ Pre-code simulation (completeness, ambiguity, contradiction, testability)
- ✅ 4-layer Executable Specs (narrative + pointers + constraints + Gherkin)
- ✅ Immutable spec approval (SHA-256 hash + audit trail)
- ✅ 3-format export (Markdown, JSON, Gherkin)

### Integration
- ✅ MCP Server with dual transport (STDIO + HTTP)
- ✅ All 6 MCP tools
- ✅ Claude Desktop integration (`~/.claude/settings.json`)
- ✅ Cursor HTTP integration

### Frontend
- ✅ Landing page
- ✅ Interactive demo (streaming spec generation + export)
- ✅ Feature dashboard (create, search, filter, manage specs)
- ✅ Feature detail (full spec + traceability graph + approve/regenerate)
- ✅ Context ingestion form (multi-step with preview)

### Quality
- ✅ 169 tests, 91.4% coverage
- ✅ TypeScript strict mode (zero `any` in core)
- ✅ GitHub Actions CI (build + lint + type-check + tests)
- ✅ Vercel deployment pipeline
- ✅ Audit logging for compliance

---

## Roadmap (v2.0+)

- [ ] Live collaboration (multi-user spec editing)
- [ ] Slack/Jira webhook ingestion (auto-sync context)
- [ ] Linear/GitHub integration (auto-create issues from approved specs)
- [ ] Vector search UI (explore context by similarity)
- [ ] Spec versioning UI (diff between v1 → v2)
- [ ] Custom LLM routing (use customer's own API key)
- [ ] Agent-to-agent protocol (A2A delegation)
- [ ] Enterprise SSO (SAML/OAuth)
- [ ] Data residency options (EU, US)

---

## Documentation

- **[CLAUDE.md](./CLAUDE.md)** — MCP configuration for Claude Desktop + Cursor
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** — Vercel deployment guide
- **[CHANGELOG.md](./CHANGELOG.md)** — Version history
- **[AGENTS.md](./AGENTS.md)** — Multi-agent architecture
- **[INTEGRATION_TEST_PLAN.md](./INTEGRATION_TEST_PLAN.md)** — Test coverage details

---

## Support

- **Issues:** [GitHub Issues](https://github.com/shreyanshjain7174/specwright/issues)
- **Status:** Production ready (v1.0.0)

## License

MIT — See [LICENSE](./LICENSE) for details.

---

**Built with 💜 for product engineers who hate vague specs.**

*v1.0.0 — Released 2026-02-27 (built overnight in 9 phases)*
