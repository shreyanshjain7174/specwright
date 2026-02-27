# Specwright — The Reasoning Engine

> **"Cursor for Product Management"** — A context intelligence platform that transforms chaotic, unstructured product inputs into deterministic, traceable specifications for AI coding tools.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/import/project?template=https://github.com/shreyanshjain7174/specwright)

## Architecture

```
┌─────────────────────────────────────────────┐
│           Next.js Web Platform              │
│     Landing  •  Dashboard  •  Demo          │
└────────────────┬────────────────────────────┘
                 │ API Routes
┌────────────────▼────────────────────────────┐
│          Hybrid Retrieval Router            │
│                                             │
│  Short-form (<500 tok)    Long-form (PDFs)  │
│  ┌─────────────────┐    ┌────────────────┐  │
│  │  Direct context  │    │  PageIndex     │  │
│  │  (pass-through)  │    │  Tree Search   │  │
│  └────────┬────────┘    └───────┬────────┘  │
│           └──────┬──────────────┘            │
│                  ▼                           │
│          Merged Context                      │
└────────────────┬────────────────────────────┘
                 │
┌────────────────▼────────────────────────────┐
│        Cloudflare Workers AI (Llama 3.3)    │
│   Spec Compilation  •  Pre-Code Simulation  │
└────────────────┬────────────────────────────┘
                 │
┌────────────────▼────────────────────────────┐
│       Neon PostgreSQL + pgvector            │
│  features │ specs │ raw_inputs │ documents  │
└─────────────────────────────────────────────┘
```

### Stack
- **Frontend**: Next.js 15, React 19, TailwindCSS, Lucide icons, Framer Motion
- **AI**: Cloudflare Workers AI (Llama 3.3-70B) via OpenAI-compatible API
- **Retrieval**: PageIndex (reasoning-based RAG for long documents) + pgvector (short-form context)
- **Database**: Neon PostgreSQL (serverless)
- **MCP Server**: `@modelcontextprotocol/sdk` via StdioServerTransport
- **Deployment**: Vercel + GitHub Actions CI/CD

### AI Stack

| Component | Purpose |
|-----------|---------|
| **Cloudflare Workers AI** | Spec compilation + pre-code simulation via Llama 3.3-70B |
| **PageIndex** | Reasoning-based document retrieval — builds tree indexes for PDFs and uses multi-step reasoning to find relevant sections (98.7% accuracy on FinanceBench) |
| **Hybrid Router** | Routes short-form context (Slack, Jira) directly to AI; long-form docs (PDFs, call transcripts) through PageIndex first |

## Quick Start

```bash
# 1. Clone
git clone https://github.com/shreyanshjain7174/specwright.git
cd specwright

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your DATABASE_URL, CLOUDFLARE_API_KEY, and optionally PAGEINDEX_API_KEY

# 4. Start dev server
npm run dev
```

### MCP Server
```bash
npm run mcp
```

## API Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/features` | List all features with context counts |
| POST | `/api/features` | Create a new feature |
| POST | `/api/context/ingest` | Ingest raw context linked to a feature |
| POST | `/api/specs/compile` | Compile context into executable spec (supports hybrid retrieval) |
| POST | `/api/specs/simulate` | Run pre-code simulation on a spec |
| POST | `/api/documents/upload` | Upload PDF for PageIndex tree indexing |
| GET | `/api/documents/status` | Check document processing status |
| POST | `/api/documents/query` | Reasoning-based retrieval from documents |

## Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/demo` | Interactive spec generation with document upload |
| `/dashboard` | Feature management dashboard |
| `/dashboard/ingest` | Context ingestion form |
| `/dashboard/features/[id]` | Feature detail with traceability |

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | Neon PostgreSQL connection string |
| `CLOUDFLARE_API_KEY` | ✅ | Cloudflare Workers AI API key |
| `PAGEINDEX_API_KEY` | ❌ | PageIndex API key for reasoning-based document retrieval ([get one free](https://dash.pageindex.ai/api-keys)) |

## Deployment

### Option 1: Vercel (Recommended for SaaS)

The app deploys automatically via GitHub Actions on push to `main`.

```bash
# Or deploy manually
npx vercel --prod
```

Vercel's Neon integration auto-provisions `DATABASE_URL`. Set `CLOUDFLARE_API_KEY` in the Vercel dashboard under Settings → Environment Variables.

### Option 2: Docker (Self-Hosted / Enterprise)

```bash
# Build and run
docker compose up -d

# Or build manually
docker build -t specwright .
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e CLOUDFLARE_API_KEY="..." \
  specwright
```

The Docker image uses Next.js standalone output (~150MB) with a health check at `/api/health`.

### Option 3: Local Development

```bash
npm install
cp .env.example .env  # Fill in your keys
npm run dev            # Web app at localhost:3000
```

## MCP Integration

Specwright exposes an MCP server for AI coding agents (Cursor, Claude Desktop, etc.).

### HTTP (Production — via deployed app)

The MCP tools are available at `/api/mcp` on any deployed instance:

```bash
# List tools
curl https://your-app.vercel.app/api/mcp

# Call a tool
curl -X POST https://your-app.vercel.app/api/mcp \
  -H "Content-Type: application/json" \
  -d '{"tool_name": "list_features", "arguments": {}}'
```

### STDIO (Local — for Cursor / Claude Desktop)

```bash
npm run mcp
```

Add to your Cursor MCP config (`.cursor/mcp.json`):
```json
{
  "mcpServers": {
    "specwright": {
      "command": "npx",
      "args": ["tsx", "src/index.ts"],
      "cwd": "/path/to/specwright"
    }
  }
}
```

### MCP Tools

| Tool | Description |
|------|-------------|
| `fetch_spec` | Retrieve a complete Executable Specification by feature name |
| `ingest_context` | Ingest raw context (Slack, Jira, transcript) linked to a feature |
| `generate_spec` | Generate a spec from ingested context |
| `list_features` | List all features with spec status |
| `get_constraints` | Get DO NOT constraint rules for a feature |
| `run_simulation` | Run pre-code simulation to catch errors before implementation |

## Connectors

| Connector | Source | What It Imports |
|-----------|--------|-----------------|
| Slack | Channels & threads | Messages, thread replies |
| Jira | Projects | Issues, comments, descriptions |
| Notion | Workspaces | Pages, database items, block content |
| Gong | Call recordings | Transcripts with speaker identification |
| Confluence | Spaces | Pages with content |

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | Neon PostgreSQL connection string |
| `CLOUDFLARE_API_KEY` | ✅ | Cloudflare Workers AI API key |
| `PAGEINDEX_API_KEY` | ❌ | PageIndex API key for reasoning-based document retrieval |
| `NEXT_PUBLIC_APP_URL` | ❌ | Base URL (auto-set on Vercel; required for Docker) |

## Health Check

```bash
curl http://localhost:3000/api/health
```

Returns service status for database, AI, and MCP tools with latency metrics.

## License
MIT
