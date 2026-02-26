# Specwright Deployment Checklist

**Target**: Vercel production deployment  
**Timeline**: After Phase 6 (Integration Testing) passes  
**Owner**: Orchestrator Agent  

---

## Pre-Deployment (Code Review)

### Git History
- [ ] All commits have descriptive messages
- [ ] No "WIP" or "temp" commits
- [ ] Commits are atomic (one feature per commit)
- [ ] No secrets committed (run `git secrets --scan`)

### Code Quality
- [ ] `npm run build` — Clean build
- [ ] `npx tsc --noEmit` — No TypeScript errors
- [ ] `npm run lint` — No linting errors (or acceptable warnings)
- [ ] `npm run test` — All tests pass locally
- [ ] No console.errors in app code (debug logs removed)
- [ ] Error boundaries implemented on all pages
- [ ] Graceful degradation for missing APIs

### Dependencies
- [ ] `npm audit` — No critical vulnerabilities
- [ ] No unused dependencies (check `package.json`)
- [ ] All peer dependencies resolved
- [ ] Lock file committed (`pnpm-lock.yaml` or `package-lock.json`)

### Documentation
- [ ] README.md updated with new features
- [ ] CLAUDE.md updated with MCP config + current status
- [ ] INTEGRATION_TEST_PLAN.md reviewed + signed off
- [ ] API routes documented (comment each endpoint)
- [ ] MCP tools documented (CLAUDE.md section)
- [ ] Database schema documented (migrations have comments)
- [ ] CHANGELOG.md created with v1.0.0 entry

---

## Environment Configuration

### Production Env Vars (Set in Vercel Dashboard)
```
MEMGRAPH_URI=bolt://[production-memgraph-host]:7687
MEMGRAPH_USER=[secure]
MEMGRAPH_PASSWORD=[secure]
QDRANT_URI=[production-qdrant-url]
DATABASE_URL=[neon-prod-url]
CLOUDFLARE_ACCOUNT_ID=[secure]
CLOUDFLARE_API_TOKEN=[secure]
MCP_SERVER_MODE=stdio
```

### Checks
- [ ] `DATABASE_URL` points to production Neon (check domain)
- [ ] No local/staging URLs in env vars
- [ ] All secrets are set (don't leave as placeholders)
- [ ] Test credentials removed
- [ ] Logging level appropriate (not DEBUG on production)

---

## Database Migrations

### Pre-Deployment
- [ ] All migrations tested locally
- [ ] Migrations are reversible (have DOWN statements)
- [ ] No data loss in migrations
- [ ] Migration files named correctly (`0001_`, `0002_`, etc.)
- [ ] Migration timestamps are in sequence

### On Deployment (Vercel)
- [ ] Run migrations on production database BEFORE deploying code
  ```bash
  neon psql [DATABASE_URL] < drizzle/migrations/0001_initial.sql
  neon psql [DATABASE_URL] < drizzle/migrations/0002_*.sql
  ```
- [ ] Verify migration success (query affected tables)
- [ ] Backup production database before migrations

---

## API & Routes

### Validation
- [ ] All 5 API routes implement error handling
- [ ] Request validation on all POST endpoints
- [ ] Response types match documentation
- [ ] Rate limiting configured (if needed)
- [ ] CORS headers appropriate (not `Access-Control-Allow-Origin: *`)
- [ ] No sensitive data in logs
- [ ] Audit trail logging functional

### API Routes to Check
- [ ] POST `/api/context/ingest` — Validate, store, return chunk IDs
- [ ] POST `/api/specs/generate` — Streaming response, progress events
- [ ] POST `/api/specs/simulate` — Run validator, return score
- [ ] POST `/api/specs/approve` — Hash spec, lock it, audit log
- [ ] GET `/api/specs/[id]/export?format=` — 3 formats, all working

---

## MCP Server

### STDIO Mode
- [ ] `npm run mcp` starts without errors
- [ ] Listens on stdin
- [ ] Responds to tool calls
- [ ] Graceful shutdown on SIGINT
- [ ] Tested with Claude Desktop locally

### HTTP Mode
- [ ] `MCP_SERVER_MODE=http npm run mcp` starts
- [ ] Listens on `http://localhost:3001` (or configured port)
- [ ] `GET /mcp/manifest` returns correct JSON
- [ ] `POST /mcp/call` routes to correct tool
- [ ] CORS headers present
- [ ] Both modes work identically

### Tools (All 6)
- [ ] `fetch_spec` returns complete 4-layer spec
- [ ] `ingest_context` stores + returns context ID
- [ ] `generate_spec` returns job ID for polling
- [ ] `list_features` returns feature list with status
- [ ] `get_constraints` returns constraint layer only
- [ ] `run_simulation` returns simulation results

---

## Frontend

### Landing Page
- [ ] Hero section loads correctly
- [ ] 4-layer spec cards visible + animated
- [ ] Before/after example displays properly
- [ ] MCP integration callout present
- [ ] CTA buttons redirect correctly
- [ ] Footer links functional
- [ ] Mobile responsive (test on 320px viewport)

### Demo Page
- [ ] Textarea accepts input
- [ ] Source type selector works
- [ ] Generate button triggers API call
- [ ] Progress display streams correctly
- [ ] Output tabs show data
- [ ] Export buttons work (download + clipboard)
- [ ] Cursor setup modal displays

### Dashboard
- [ ] Feature list loads
- [ ] Status badges correct colors
- [ ] Search functionality works
- [ ] Create feature button opens form
- [ ] Feature rows clickable

### Feature Detail
- [ ] Spec displays in tabs
- [ ] Traceability graph renders
- [ ] Links clickable
- [ ] Approve button works
- [ ] Re-generate button works

### Context Ingest Form
- [ ] Multi-step form navigation works
- [ ] Validation on each step
- [ ] Chunk preview accurate
- [ ] Submit creates record

### Accessibility
- [ ] Semantic HTML used
- [ ] ARIA labels present on interactive elements
- [ ] Keyboard navigation works (Tab key)
- [ ] Color contrast WCAG AA (4.5:1 for text)
- [ ] Screen reader friendly (test with VoiceOver/NVDA)

---

## Performance

### Metrics (Use Lighthouse or WebPageTest)
- [ ] First Contentful Paint (FCP) < 2s
- [ ] Largest Contentful Paint (LCP) < 2.5s
- [ ] Cumulative Layout Shift (CLS) < 0.1
- [ ] Time to Interactive (TTI) < 3.5s

### Optimization
- [ ] Images optimized (WebP format, lazy loading)
- [ ] Code split + tree-shaken (no dead code)
- [ ] API responses cached where appropriate
- [ ] Database queries optimized (no N+1 problems)

---

## Security

### Dependencies
- [ ] No critical CVEs (`npm audit`)
- [ ] Packages from npm registry only (not git/file URLs)
- [ ] Pinned versions (or ~semver, not ^)

### Input Validation
- [ ] All user inputs validated
- [ ] No SQL injection possible (use parameterized queries)
- [ ] No XSS vectors (HTML escaped, Content-Type headers correct)
- [ ] No CSRF (CORS properly configured)

### Secrets
- [ ] No API keys in code
- [ ] No database passwords in code
- [ ] No JWT secrets in code
- [ ] Sensitive vars marked `[secure]` in .env
- [ ] Private keys not committed

### HTTPS
- [ ] Only HTTPS (no HTTP)
- [ ] HSTS headers set
- [ ] Secure cookies (HttpOnly, Secure, SameSite flags)

---

## Testing

### Before Deploy
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] Integration test plan (T1-T12) passed
- [ ] Manual smoke testing complete
- [ ] No flaky tests

### After Deploy
- [ ] Verify landing page loads
- [ ] Verify API endpoints respond
- [ ] Verify MCP server starts
- [ ] Verify database queries work
- [ ] Check error tracking (Sentry/equivalent if set up)

---

## Deployment Steps (Vercel)

### Option 1: Git Push (Recommended)
```bash
# Ensure everything committed
git status

# Push to main branch
git push origin main

# Vercel auto-deploys via GitHub integration
# Monitor: https://vercel.com/projects/specwright
```

### Option 2: Vercel CLI
```bash
# Login
npx vercel login

# Deploy to production
npx vercel --prod
```

### Option 3: Vercel Dashboard
1. Connect GitHub repo (if not already done)
2. Set environment variables
3. Click "Deploy"

### Post-Deployment Verification
```bash
# Check deployment status
curl https://specwright.vercel.app/api/health

# Expected response:
# { "status": "ok", "timestamp": "..." }
```

---

## Rollback Plan (If Issues Found)

### Quick Rollback (Vercel Dashboard)
1. Go to "Deployments" tab
2. Find previous working deployment
3. Click "Promote to Production"
4. Verify site works

### Full Rollback (Git)
```bash
# Find previous stable commit
git log --oneline | head -10

# Revert to stable commit
git revert -n HEAD
git commit -m "Rollback: reverting to previous stable version"
git push origin main

# Vercel auto-deploys the revert
```

### Notify Team
- [ ] Slack message: "Deployment rolled back, investigating issue"
- [ ] Post-mortem: What went wrong? How to prevent?

---

## Post-Deployment (First 24 Hours)

### Monitoring
- [ ] Error tracking service working (if set up)
- [ ] Database performance normal
- [ ] API response times acceptable
- [ ] No spike in 5xx errors

### User Feedback
- [ ] First users testing the demo page
- [ ] Collecting feedback via waitlist email
- [ ] Monitoring demo conversions (did users stay or bounce?)

### Documentation
- [ ] Update public docs with new features
- [ ] Create launch blog post (if doing public launch)
- [ ] Add analytics tracking (if needed)

---

## Sign-Off

**Ready to Deploy?**

- [ ] Orchestrator Agent: Code quality ✅
- [ ] QA Agent: Testing ✅
- [ ] PM Agent: Frontend ✅
- [ ] Engineer Agent: Backend ✅
- [ ] Architect Agent: System integrity ✅

**Deployment Authorized By**: ___________________ (Shreyansh)

**Date**: ___________________

**Estimated Time to Deploy**: 5-15 minutes  
**Estimated Downtime**: 0 (blue-green deployment)

---

## Version

- **Version**: v1.0.0
- **Release Date**: 2026-02-27
- **Status**: Production Ready

---

*This checklist ensures production-grade deployment. Do not skip steps.*
