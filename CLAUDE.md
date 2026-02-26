# CLAUDE.md — AI Assistant Context for Specwright

> **Read this first** before contributing to this project. Contains MCP setup, architecture, and current status.

---

## What Is Specwright?

**Specwright** is a context intelligence platform that transforms unstructured product inputs into **4-layer Executable Specifications** for AI coding agents.

**One-line pitch:** "Cursor for Product Management" — auto-ingests context from Slack/Jira/Notion, grounds every requirement in real evidence, simulates the feature pre-code, and locks the spec with a SHA-256 hash.

---

## MCP Server Integration

### Claude Desktop (STDIO Mode)

Add to `~/.claude/settings.json` (create if it doesn't exist):

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
        "QDRANT_API_KEY": "your-qdrant-api-key"
      }
    }
  }
}
```

Replace `/absolute/path/to/specwright` with the actual path (e.g., `/Users/sunny/specwright`).

Restart Claude Desktop. **Specwright** will appear in the tool selection menu.

### Cursor (HTTP Mode)

1. Start the MCP HTTP server:
```bash
cd /path/to/specwright
MCP_SERVER_MODE=http MCP_HTTP_PORT=3001 npm run mcp
```

2. In Cursor settings → MCP → Add server URL: `http://localhost:3001`

3. Verify:
```bash
# Check manifest
curl http://localhost:3001/mcp/manifest

# Test tool call
curl -X POST http://localhost:3001/mcp/call \
  -H "Content-Type: application/json" \
  -d '{
    "tool_name": "list_features",
    "arguments": {}
  }'
```

### Available MCP Tools

| Tool | Description |
|------|-------------|
| `fetch_spec` | Get complete 4-layer Executable Spec for a feature |
| `ingest_context` | Add raw context (Slack thread, Jira ticket, transcript, etc.) |
| `generate_spec` | Trigger full spec generation pipeline |
| `list_features` | Browse features with status filter |
| `get_constraints` | Get DO NOT rules for a feature |
| `run_simulation` | Run pre-code simulation (4 validators) |

---

## Technical Architecture

```
┌─────────────────────────────────────────────────────────┐
│               Next.js Web Platform                      │
│  Landing • Demo • Dashboard • Ingest                    │
└────────────┬──────────────────────┬────────────────────┘
             │                      │
     ┌───────▼──────┐       ┌──────▼──────────────┐
     │  React 19    │       │ Neon PostgreSQL     │
     │  TailwindCSS │       │ + pgvector (1536D)  │
     └──────────────┘       └────────┬────────────┘
                                     │
                    ┌────────────────┼────────────────┐
         ┌──────────▼──────┐  ┌──────▼──────┐  ┌────▼──────────┐
         │ Memgraph        │  │ Qdrant      │  │ Audit Trail   │
         │ (traceability)  │  │ (vectors)   │  │ (compliance)  │
         └─────────────────┘  └─────────────┘  └───────────────┘
                                     │
                    ┌────────────────▼────────────────┐
                    │  Multi-Agent Orchestrator       │
                    │  ContextHarvester • SpecDraft   │
                    │  ConstraintExtractor            │
                    │  GherkinWriter • AdversaryReview│
                    └────────────────┬────────────────┘
                                     │
                    ┌────────────────▼────────────────┐
                    │  Pre-Code Simulator             │
                    │  (4 validators)                 │
                    └────────────────┬────────────────┘
                                     │
                    ┌────────────────▼────────────────┐
                    │  MCP Server                     │
                    │  STDIO (Claude) • HTTP (Cursor) │
                    └─────────────────────────────────┘
```

### Key Source Paths

```
specwright/
├── app/                    # Next.js App Router
│   ├── api/               # REST API routes
│   │   ├── context/       # Context ingestion + search
│   │   ├── features/      # Feature CRUD
│   │   ├── specs/         # Spec generation, simulate, approve, export
│   │   └── health/        # System health check
│   ├── dashboard/         # Dashboard pages
│   └── demo/              # Interactive demo
├── lib/                   # Core library (used by app/)
│   ├── agents/            # Multi-agent orchestration (ReAct)
│   ├── context/           # Ingestion + chunking + retrieval
│   ├── simulator/         # Pre-code simulation engine
│   ├── db.ts              # Database client (Neon)
│   ├── types.ts           # Shared TypeScript types
│   └── mcp-server.ts      # MCP server info stub
├── src/                   # MCP server (standalone process)
│   ├── index.ts           # MCP server entry point
│   └── lib/               # Spec compiler, agents, ingestion
├── tests/                 # Test suites
│   ├── unit/              # Unit tests (agents, simulator, compiler, ingestion)
│   └── integration/       # Integration tests (API, MCP)
└── drizzle/               # Database migrations
```

---

## Development Commands

```bash
# Development server
npm run dev

# Build for production (must pass with zero errors)
npm run build

# TypeScript check
npx tsc --noEmit

# Lint (zero errors required)
npm run lint

# Run all tests
npm test

# Tests with coverage
npm run test:coverage

# MCP server (STDIO)
npm run mcp

# MCP server (HTTP)
MCP_SERVER_MODE=http npm run mcp

# Database migrations
npx drizzle-kit push
```

---

## Code Style

- **TypeScript**: Strict mode. No `any` in core library code.
- **Functions**: Pure where possible, side effects isolated.
- **Comments**: Explain "why", not "what".
- **Tests**: Write tests for logic, aim for >80% coverage on core.
- **Commits**: Conventional commits preferred (`feat:`, `fix:`, `docs:`, `test:`).

---

## Current Build Status

**Phase 9 complete — all 9 phases done. Production ready.**

| Phase | Status | Description |
|-------|--------|-------------|
| Phase 1 | ✅ | Project scaffold + DB schema |
| Phase 2 | ✅ | Core engine (ingestion, orchestrator, simulator) |
| Phase 3 | ✅ | MCP server (STDIO + HTTP, all 6 tools) |
| Phase 4 | ✅ | REST API routes (all endpoints) |
| Phase 5 | ✅ | Frontend (landing, demo, dashboard) |
| Phase 6 | ✅ | Integration (health, context search, export) |
| Phase 7 | ✅ | Testing (169 tests, 91.4% coverage) |
| Phase 8 | ✅ | Quality (TypeScript strict, lint clean) |
| Phase 9 | ✅ | Documentation + deployment (this file) |

**Verified:**
- `npm run build` → ✅ Zero errors
- `npx tsc --noEmit` → ✅ Zero errors  
- `npm run lint` → ✅ Zero errors (56 warnings, all acceptable)
- `npm test` → ✅ 169/169 passing

---

## Known Limitations

1. **MCP server is separate from Vercel deployment** — The MCP server (`npm run mcp`) runs as a local process, not on Vercel. This is intentional (STDIO transport requires a local process).

2. **Memgraph is optional** — The traceability graph (Memgraph) gracefully degrades if not configured. Core spec generation works without it.

3. **AI embeddings require Cloudflare** — Without `CLOUDFLARE_ACCOUNT_ID` + `CLOUDFLARE_API_TOKEN`, embeddings use mock vectors (still functional for basic flows, but semantic search quality degrades).

4. **`next lint` deprecated in Next.js 15** — Use `npm run lint` (calls ESLint directly) for accurate lint results.

5. **Next.js 15 async params** — Dynamic route handlers use `await params` (Promise-based). Older examples using `{ params }` destructuring without await will show TypeScript errors.

---

## Roadmap (v2.0+)

- [ ] Slack/Jira webhook auto-ingestion
- [ ] Linear/GitHub issue creation from approved specs
- [ ] Spec versioning UI (diff v1 → v2)
- [ ] Custom LLM routing (customer's own API key)
- [ ] Agent-to-agent protocol (A2A delegation)
- [ ] Enterprise SSO (SAML/OAuth)
- [ ] Live collaboration (multi-user editing)

---

## Contributing

1. Read this file + README.md
2. Check `memory/` for recent decisions
3. Run `npm test` before committing
4. Use conventional commits
5. PRs must pass CI (build + lint + type-check + tests)

---

*Last updated: 2026-02-27 · Phase 9 complete*
