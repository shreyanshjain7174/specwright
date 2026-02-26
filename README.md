# Specwright — The Reasoning Engine

> **"Cursor for Product Management"** — A context intelligence platform that transforms chaotic, unstructured product inputs into deterministic, traceable specifications for AI coding tools.

## Architecture

```
┌─────────────────────────────────┐
│       Next.js Web Platform      │
│  Landing • Dashboard • Demo     │
└────────────┬────────────────────┘
             │ API Routes
┌────────────▼────────────────────┐
│      Neon PostgreSQL + pgvector │
│  features │ specs │ raw_inputs  │
│  Vector search (1536-dim)       │
└─────────────────────────────────┘
             │
┌────────────▼────────────────────┐
│       MCP Server (STDIO)        │
│  generate_traceable_spec        │
│  ingest_context                 │
└─────────────────────────────────┘
```

### Stack
- **Frontend**: Next.js 15, React 19, TailwindCSS, Lucide icons
- **Database**: Neon PostgreSQL with pgvector (managed, serverless)
- **Local Dev**: Docker Compose (Memgraph, Qdrant, n8n)
- **MCP Server**: `@modelcontextprotocol/sdk` via StdioServerTransport

## Knowledge Graph Schema

| Table | Columns |
|-------|---------|
| `features` | id, name, description, created_at, updated_at |
| `specs` | id, feature_id (FK), details, created_at |
| `raw_inputs` | id, source, content, feature_id (FK), embedding (vector 1536), created_at |

### Traceability
`Feature → Spec → RawInput` — every specification traces back to actual user quotes.

## Setup

```bash
# 1. Clone
git clone <repo-url>
cd reasoning-engine

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your Neon DATABASE_URL

# 4. Start dev server
npm run dev
```

### Local Infrastructure (Optional)
```bash
docker-compose up -d
# Starts: Memgraph (7687/3000), Qdrant (6333/6334), n8n (5678)
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
| POST | `/api/specs/generate` | Generate traceable spec for a feature |
| POST | `/api/specs/compile` | Compile context into executable spec (demo) |
| POST | `/api/specs/simulate` | Run pre-code simulation on a spec (demo) |

## Pages

- `/` — Landing page
- `/demo` — Interactive spec generation demo
- `/dashboard` — Feature management dashboard
- `/dashboard/ingest` — Context ingestion form
- `/dashboard/features/[id]` — Feature detail with traceability

## License
MIT
