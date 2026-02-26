# Deployment Guide — Specwright v1.0.0

> Deploy Specwright to Vercel in under 10 minutes.

---

## Prerequisites

- GitHub repo pushed (or fork this repo)
- [Vercel account](https://vercel.com) (free tier works)
- Neon PostgreSQL database ([neon.tech](https://neon.tech))
- Qdrant vector store ([cloud.qdrant.io](https://cloud.qdrant.io) or self-hosted)
- Cloudflare Workers AI account (for embeddings — optional but recommended)

---

## Step 1: Connect GitHub Repository

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **"Import Git Repository"**
3. Select your `specwright` repository
4. Vercel will auto-detect **Next.js** — confirm the framework preset

---

## Step 2: Configure Environment Variables

In the Vercel dashboard, navigate to:  
**Project → Settings → Environment Variables**

Add the following variables:

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Neon PostgreSQL connection string | `postgresql://user:pass@ep-xxx.neon.tech/specwright?sslmode=require` |
| `QDRANT_URI` | Qdrant vector database URL | `https://your-cluster.aws.cloud.qdrant.io:6333` |
| `QDRANT_API_KEY` | Qdrant API key (if cloud) | `your-qdrant-api-key` |

### Recommended

| Variable | Description | Example |
|----------|-------------|---------|
| `CLOUDFLARE_ACCOUNT_ID` | For AI embeddings + inference | `abc123def456` |
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token with Workers AI permission | `your-cf-token` |

### Optional

| Variable | Description | Default |
|----------|-------------|---------|
| `MEMGRAPH_URI` | Memgraph graph database URI | `bolt://localhost:7687` |
| `MEMGRAPH_USERNAME` | Memgraph username | _(empty)_ |
| `MEMGRAPH_PASSWORD` | Memgraph password | _(empty)_ |
| `NEXT_PUBLIC_APP_URL` | Public URL for the app | Auto-detected by Vercel |
| `MCP_SERVER_MODE` | MCP transport: `stdio` or `http` | `stdio` |
| `MCP_HTTP_PORT` | MCP HTTP server port | `3001` |

> **Tip:** Set environment variables for **Production**, **Preview**, and **Development** separately in Vercel.

---

## Step 3: Deploy to Preview

Click **"Deploy"** in the Vercel dashboard.

Vercel will:
1. Install dependencies (`npm ci`)
2. Build the Next.js app (`npm run build`)
3. Deploy to a preview URL like `specwright-abc123.vercel.app`

Wait for the deployment to complete (typically 2–3 minutes).

---

## Step 4: Test /api/health

Once deployed, verify all services are connected:

```bash
curl https://your-preview-url.vercel.app/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2026-02-27T00:00:00.000Z",
  "services": {
    "database": { "connected": true, "latency_ms": 45 },
    "qdrant": { "connected": true },
    "mcp": { "running": true }
  }
}
```

If `status` is `"degraded"`, check the service that shows `"connected": false` and verify its environment variable.

---

## Step 5: Run Database Migrations

After first deploy, run migrations against your Neon database:

```bash
# Locally, with your production DATABASE_URL
DATABASE_URL="your-neon-connection-string" npx drizzle-kit push
```

Or use the Neon console to run migrations from `drizzle/` directory.

---

## Step 6: Deploy to Production

Once the preview is verified:

1. In Vercel dashboard → **"Promote to Production"**  
   OR

```bash
# From local machine with Vercel CLI
vercel --prod
```

Your app is now live at: `https://your-project.vercel.app`

---

## Local Verification

Before deploying, always verify the build passes locally:

```bash
# 1. Copy env template
cp .env.example .env
# Edit .env with your credentials

# 2. Install dependencies
npm ci

# 3. TypeScript check
npx tsc --noEmit

# 4. Lint check
npm run lint

# 5. Run tests
npm test

# 6. Build
npm run build

# 7. Start production server
npm start
# Visit http://localhost:3000/api/health
```

---

## GitHub Actions CI

This project includes automatic CI/CD via `.github/workflows/ci.yml`.

Every push to `main` triggers:
1. ✅ TypeScript type check (zero errors)
2. ✅ ESLint (zero errors)
3. ✅ `npm run build` (zero errors)
4. ✅ `npm test` (all 169 tests pass)
5. 🚀 Deploy to Vercel (via `deploy.yml`)

PRs that fail CI are blocked from merging.

---

## Troubleshooting

### Build fails with "DATABASE_URL missing"
→ Add `DATABASE_URL` to Vercel environment variables.

### `/api/health` shows `database: { connected: false }`
→ Check Neon connection string format. Ensure `?sslmode=require` is appended.

### Qdrant connection fails
→ Verify `QDRANT_URI` includes port (e.g., `:6333`). For cloud Qdrant, also set `QDRANT_API_KEY`.

### "Cannot find module '@/lib/...'"
→ Run `npm run build` locally to check for missing modules before deploying.

### MCP server not connecting in Claude Desktop
→ The MCP server runs separately (`npm run mcp`), not via Vercel. See CLAUDE.md for MCP setup.

---

## Architecture Notes

- **Frontend + API routes**: Deployed on Vercel (serverless)
- **MCP server**: Runs locally/on VPS via `npm run mcp` (not on Vercel)
- **Database**: Neon PostgreSQL (serverless, auto-scales)
- **Vector search**: Qdrant cloud or self-hosted
- **Graph DB**: Memgraph (optional, self-hosted)

---

*Questions? Open an issue at [github.com/shreyanshjain7174/specwright/issues](https://github.com/shreyanshjain7174/specwright/issues)*
