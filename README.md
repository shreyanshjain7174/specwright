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

### Vercel (Production)

The app is deployed on Vercel with automatic deployments via GitHub Actions.

```bash
# Deploy manually via Vercel CLI
npx vercel --prod
```

### Neon Integration

The database is hosted on [Neon](https://neon.tech) — a serverless PostgreSQL platform with pgvector support. Vercel's Neon integration auto-provisions the `DATABASE_URL` environment variable.

## License
MIT
