# Specwright — The Reasoning Engine

> **"Cursor for Product Management"** — A context intelligence platform that transforms chaotic, unstructured product inputs into deterministic, traceable Executable Specifications for AI coding tools. No hallucinated requirements. Only evidence-grounded specs.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/import/project?template=https://github.com/shreyanshjain7174/specwright)

## The Problem & Solution

**Problem**: AI coding tools (Cursor, Windsurf, Claude Code) have made writing code nearly free. The bottleneck shifted upstream to **defining what to build**.
- PMs write vague PRDs in Notion
- Context scattered across Slack, Jira, Zendesk, Gong calls
- AI agents receive low-fidelity instructions → implement productively-wrong features
- Manual "telephone game" is the primary bottleneck

**Solution**: Transform unstructured context into **4-layer Executable Specifications**:
1. **Narrative Layer** — Human-readable intent (Markdown)
2. **Context Pointer Layer** — RAG-grounded evidence URIs (quotes, timestamps, sources)
3. **Constraint Layer** — Explicit DO NOT rules (schema locks, deprecated libraries, latency budgets)
4. **Verification Layer** — Gherkin Given/When/Then acceptance tests

Every requirement links back to a real source (customer quote, Slack thread, API schema). No hallucinations.

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
- **Frontend**: Next.js 15, React 19, TailwindCSS, Lucide icons
- **Backend**: Node.js 18+, TypeScript (strict mode)
- **Database**: Neon PostgreSQL + pgvector (serverless)
- **Graph**: Memgraph (traceability relationships)
- **Vector DB**: Qdrant (semantic embeddings)
- **AI**: Cloudflare Workers AI (embeddings + inference)
- **MCP**: Model Context Protocol (dual STDIO + HTTP transport)
- **Deployment**: Vercel (frontend + API routes)

## Database Schema

| Table | Purpose | Key Columns |
|-------|---------|------------|
| `organisations` | Multi-tenant isolation | id, name, slug, created_at |
| `features` | Product features | id, name, description, org_id, created_at |
| `context_sources` | Raw ingested input | id, source_type, content, embedding (vector), feature_id, valid_at, deprecated_at |
| `specs` | Executable specifications | id, feature_id, version, status (draft/simulated/approved), narrative, context_pointers, constraints, gherkin_tests, hash, simulation_result |
| `audit_log` | Compliance trail | id, action, entity_type, entity_id, payload, created_at |

**Traceability**: `Feature` → `Spec` (versioned, immutable when approved) → `ContextSource` (evidence citations)

## Quick Start

### Prerequisites
- Node.js 18+
- npm or pnpm
- PostgreSQL client (`psql` or similar)

### Installation

```bash
# Clone repo
git clone https://github.com/shreyanshjain7174/specwright.git
cd specwright

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your credentials:
# - DATABASE_URL=postgresql://user:pass@neon-host/db
# - MEMGRAPH_URI=bolt://localhost:7687 (or service)
# - QDRANT_URI=http://localhost:6333 (or service)
# - CLOUDFLARE_ACCOUNT_ID=your-id (optional)
# - CLOUDFLARE_API_TOKEN=your-token (optional)

# Run database migrations
npx drizzle-kit push

# Start development server
npm run dev
```

Server runs at `http://localhost:3000`

### MCP Server

**STDIO Mode (Claude Desktop)**:
```bash
npm run mcp
# Add to ~/.claude/settings.json:
# {
#   "mcpServers": {
#     "specwright": {
#       "command": "npm",
#       "args": ["run", "mcp"],
#       "cwd": "/path/to/specwright"
#     }
#   }
# }
```

**HTTP Mode (Cursor Web)**:
```bash
MCP_SERVER_MODE=http npm run mcp
# Server listens at http://localhost:3001
# Endpoints: GET /mcp/manifest, POST /mcp/call
```

## API Routes

### Context Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/context/ingest` | Ingest raw input (Slack, Jira, transcript, etc.) |
| GET | `/api/context/search` | Hybrid search (vector + time-decay + source filtering) |

### Spec Generation & Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/features` | List all features with spec status |
| POST | `/api/features` | Create new feature |
| POST | `/api/specs/generate` | Trigger spec generation (streaming) |
| POST | `/api/specs/simulate` | Run pre-code validation on spec |
| POST | `/api/specs/approve` | Immutably lock spec with hash + audit log |
| GET | `/api/specs/[id]/export?format=markdown\|json\|gherkin` | Export spec in 3 formats |

### Health & Meta
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/mcp/manifest` | MCP server manifest (tools + schemas) |

## Pages (Frontend)

| Route | Description | Status |
|-------|-------------|--------|
| `/` | Landing page (hero + narrative + before/after) | ✅ Live |
| `/demo` | Interactive spec generator (streaming UI + export) | ✅ Live |
| `/dashboard` | Feature list with status badges + search | ✅ Live |
| `/dashboard/features/[id]` | Feature detail + traceability graph + approve | ✅ Live |
| `/dashboard/ingest` | Multi-step context ingestion form | ✅ Live |

## Testing

```bash
# Unit tests
npm run test:unit

# Integration tests  
npm run test:integration

# Run all tests with coverage
npm run test:coverage

# Test MCP server
npm run test:mcp
```

Target: 80%+ code coverage. See `INTEGRATION_TEST_PLAN.md` for full test suite details.

## Deployment

### Vercel (Recommended)

```bash
# One-time setup
vercel link

# Deploy to staging
vercel

# Deploy to production
vercel --prod
```

### Environment Variables (Vercel Dashboard)

Required:
- `DATABASE_URL` — Neon PostgreSQL connection string
- `MEMGRAPH_URI` — Graph database URI
- `QDRANT_URI` — Vector database URI

Optional (for embeddings):
- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`

### Pre-Deployment Checklist

See `DEPLOYMENT_CHECKLIST.md` for comprehensive production deployment guide.

## Documentation

- **[CLAUDE.md](./CLAUDE.md)** — Project context + MCP configuration for Claude Desktop & Cursor
- **[AGENTS.md](./AGENTS.md)** — Multi-agent architecture + agent responsibilities
- **[INTEGRATION_TEST_PLAN.md](./INTEGRATION_TEST_PLAN.md)** — 12 comprehensive test cases
- **[DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)** — Pre-deployment + post-deployment validation

## Features (v1.0.0)

### Core
- ✅ Semantic chunking (preserves conversation turns + paragraph boundaries)
- ✅ Multi-source ingestion (Slack, Jira, Notion, GitHub, transcripts, manual)
- ✅ Hybrid context retrieval (vector similarity + time-decay + source credibility)
- ✅ Multi-agent spec generation (ReAct orchestration with 5 specialized agents)
- ✅ Pre-code simulation (completeness, ambiguity, contradiction, testability checks)
- ✅ 4-layer Executable Specs (narrative + pointers + constraints + Gherkin)
- ✅ Immutable spec approval (SHA-256 hash + audit trail)
- ✅ 3-format export (Markdown, JSON, Gherkin)

### Integration
- ✅ MCP Server with dual transport (STDIO + HTTP)
- ✅ All 6 MCP tools (fetch_spec, ingest_context, generate_spec, list_features, get_constraints, run_simulation)
- ✅ Claude Desktop integration (via ~/.claude/settings.json)
- ✅ Cursor web integration (HTTP endpoint)

### Frontend
- ✅ Landing page (hero + narrative + before/after + CTA)
- ✅ Interactive demo (streaming spec generation + export)
- ✅ Feature dashboard (create, search, filter, manage specs)
- ✅ Feature detail (full spec view + traceability graph + approve/regenerate)
- ✅ Context ingestion form (multi-step with preview)

### Quality
- ✅ 150+ unit + integration tests (80%+ coverage)
- ✅ TypeScript strict mode
- ✅ Error boundaries on all pages
- ✅ Audit logging for compliance
- ✅ Graceful degradation (mock embeddings if no API key)

## Roadmap (v2.0+)

- [ ] Live collaboration (multi-user spec editing)
- [ ] Slack/Jira webhook ingestion (auto-sync context)
- [ ] Linear/GitHub integration (auto-create issues from approved specs)
- [ ] Vector search UI (explore context by similarity)
- [ ] Spec versioning UI (diff between v1 → v2)
- [ ] Custom LLM routing (use customer's OpenAI/Claude API key)
- [ ] Agent-to-agent protocol (A2A delegation between teams)
- [ ] Enterprise SSO (SAML/OAuth)
- [ ] Data residency options (EU, US, etc.)

## Support

- **Issues**: [GitHub Issues](https://github.com/shreyanshjain7174/specwright/issues)
- **Docs**: See `/docs` directory
- **Status**: Production ready (v1.0.0)

## License

MIT — See [LICENSE](./LICENSE) for details.

---

**Built with 💜 for product engineers who hate vague specs.**

*Last updated: 2026-02-27 (Overnight Production Build)*
