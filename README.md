# Specwright — The Reasoning Engine

> **"Cursor for Product Management"** — A context intelligence platform that transforms chaotic, unstructured product inputs into deterministic, traceable specifications for AI coding tools.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/import/project?template=https://github.com/shreyanshjain7174/specwright)

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
- **MCP Server**: `@modelcontextprotocol/sdk` via StdioServerTransport
- **Deployment**: Vercel + GitHub Actions CI/CD

## Database Schema

| Table | Columns |
|-------|---------|
| `features` | id, name, description, created_at, updated_at |
| `specs` | id, feature_id (FK), details, created_at |
| `raw_inputs` | id, source, content, feature_id (FK), embedding (vector 1536), created_at |

### Traceability
`Feature → Spec → RawInput` — every specification traces back to actual user quotes.

## Quick Start

```bash
# 1. Clone
git clone https://github.com/shreyanshjain7174/specwright.git
cd specwright

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your Neon DATABASE_URL

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
| POST | `/api/specs/generate` | Generate traceable spec for a feature |
| POST | `/api/specs/compile` | Compile context into executable spec (demo) |
| POST | `/api/specs/simulate` | Run pre-code simulation on a spec (demo) |

## Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/demo` | Interactive spec generation demo |
| `/dashboard` | Feature management dashboard |
| `/dashboard/ingest` | Context ingestion form |
| `/dashboard/features/[id]` | Feature detail with traceability |

## Deployment

### Vercel (Production)

The app is deployed on Vercel with automatic deployments via GitHub Actions.

```bash
# Deploy manually via Vercel CLI
npx vercel --prod
```

### Environment Variables (Vercel)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | Neon PostgreSQL connection string |
| `CLOUDFLARE_ACCOUNT_ID` | ❌ | Optional: Cloudflare Workers AI |
| `CLOUDFLARE_API_TOKEN` | ❌ | Optional: Cloudflare Workers AI |

### Neon Integration

The database is hosted on [Neon](https://neon.tech) — a serverless PostgreSQL platform with pgvector support. Vercel's Neon integration auto-provisions the `DATABASE_URL` environment variable.

## License
MIT
