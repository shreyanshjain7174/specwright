# Specwright Integration Test Plan

**Purpose**: Validate full end-to-end pipeline after all phases complete  
**Target**: 2026-02-27 ~03:00 IST (after Phase 2, 4, 5 complete)  
**Owner**: Orchestrator Agent  

---

## Test Scope

### Full Pipeline (Happy Path)
1. **Ingest Context** → Create feature with raw input
2. **Generate Spec** → Run orchestrator, produce 4-layer spec
3. **Simulate** → Run pre-code validation
4. **Approve** → Hash and lock spec
5. **Export** → Output in 3 formats (markdown, JSON, Gherkin)

### MCP Server (All 6 tools)
1. **STDIO Mode** → Verify Claude Desktop integration
2. **HTTP Mode** → Verify Cursor web integration
3. **Tool Calls** → All 6 tools respond correctly

### Frontend (Happy Path)
1. **Landing Page** → Load, visuals render, CTAs work
2. **Demo Page** → Input → Generate → View output → Export
3. **Dashboard** → Create feature → View specs → Search
4. **Ingest Form** → Multi-step form → Preview → Submit

---

## Pre-Test Checklist

- [ ] All builds clean (`npm run build`)
- [ ] TypeScript clean (`npx tsc --noEmit`)
- [ ] Tests pass (`npm run test` or `npm run vitest`)
- [ ] Database migrations run (`neon psql < migrations/`)
- [ ] Memgraph server running (`docker-compose up memgraph`)
- [ ] Qdrant server running (`docker-compose up qdrant`)
- [ ] Environment variables set (`.env` + test vars)
- [ ] Git history clean (no uncommitted changes)

---

## Test Cases

### T1: Context Ingestion Pipeline

**Scenario**: User ingests a Slack thread about authentication

```bash
POST /api/context/ingest
Body: {
  "source_type": "slack",
  "content": "User: We need 2FA for login. DevOps: SMS or authenticator app? PM: Both, let's start with SMS.",
  "feature_name": "user-authentication",
  "source_url": "https://slack.com/archives/C123/p1234567"
}

Expected:
- Status 201
- Response: { context_id, feature_name, source_type, message }
- DB: Context record created in Qdrant + Memgraph
- Chunk: Split into conversation turns (User → DevOps → PM)
- Embedding: 1536-dim vector created
- Metadata: All fields populated (timestamp, speaker, weight)
```

**Assertions**:
- [ ] HTTP status correct
- [ ] Context stored in Qdrant (searchable)
- [ ] Context linked in Memgraph graph
- [ ] Chunks are separate (3 turns, not 1)
- [ ] Embedding dimensions correct
- [ ] Time-decay weight calculated

---

### T2: Spec Generation (Orchestrator ReAct Loop)

**Scenario**: Generate spec from ingested context

```bash
POST /api/specs/generate
Body: {
  "feature_name": "user-authentication",
  "description": "Implement 2FA for all user accounts"
}

Expected:
- Status 202 (async job)
- Response: { job_id, polling_endpoint }
- Stream: Progress events
- Final: Complete 4-layer spec
```

**Assertions**:
- [ ] Orchestrator starts ReAct loop
- [ ] ContextHarvester retrieves relevant chunks
- [ ] SpecDraft writes narrative with evidence citations
- [ ] ConstraintExtractor finds DO NOTs (e.g., "DO NOT store SMS in plaintext")
- [ ] GherkinWriter creates BDD tests
- [ ] AdversaryReview flags ambiguities
- [ ] All 4 layers present in final spec
- [ ] Every requirement cites a source chunk ID
- [ ] No hallucinated requirements (only from ingested context)

---

### T3: Pre-Code Simulation

**Scenario**: Validate spec before implementation

```bash
POST /api/specs/simulate
Body: {
  "spec_id": "spec-abc123"
}

Expected:
- Simulation runs all checks
- Score: 0-100 (based on completeness, ambiguity, contradictions)
- Output: { passed: bool, score: number, issues: [] }
```

**Assertions**:
- [ ] Completeness check finds all happy paths
- [ ] Ambiguity detection flags vague words ("fast", "intuitive")
- [ ] Contradiction detection finds conflicts
- [ ] Testability validation ensures Gherkin for all requirements
- [ ] Coverage score calculated correctly
- [ ] Report includes specific suggestions

---

### T4: Spec Approval (Immutable Lock)

**Scenario**: Approve spec, make it read-only

```bash
POST /api/specs/approve
Body: {
  "spec_id": "spec-abc123"
}

Expected:
- Spec marked status='approved'
- SHA-256 hash generated
- Audit log entry created
- No further edits allowed
```

**Assertions**:
- [ ] Status changed to 'approved'
- [ ] Hash calculated from spec content
- [ ] Hash unique (SHA-256)
- [ ] Approved timestamp set
- [ ] Audit log entry { action: 'approve', entity_id, payload }
- [ ] Subsequent edits rejected

---

### T5: Spec Export (3 Formats)

**Scenario**: Export spec in multiple formats

```bash
GET /api/specs/abc123/export?format=markdown
GET /api/specs/abc123/export?format=json
GET /api/specs/abc123/export?format=gherkin

Expected (markdown): Human-readable spec with citations
Expected (json): Machine-readable 4-layer structure
Expected (gherkin): Syntax-highlighted Cucumber/Playwright format
```

**Assertions**:
- [ ] Markdown format valid (proper headings, lists, code blocks)
- [ ] JSON format parseable + complete
- [ ] Gherkin format valid BDD syntax
- [ ] Citations include source URLs + timestamps
- [ ] No sensitive data leaked in exports

---

### T6: MCP Tool — fetch_spec

**Scenario**: Retrieve spec via MCP (for Cursor integration)

```bash
# STDIO Mode
echo '{"name":"fetch_spec","arguments":{"feature_name":"user-authentication"}}' | node src/index.ts

# HTTP Mode
curl -X POST http://localhost:3001/mcp/call \
  -d '{"tool_name":"fetch_spec","arguments":{"feature_name":"user-authentication"}}'

Expected:
- Complete 4-layer spec returned
- All citations included
- JSON format valid
```

**Assertions**:
- [ ] STDIO mode returns correct format
- [ ] HTTP mode returns correct format
- [ ] Both modes return identical results
- [ ] Tool responds in <2 seconds
- [ ] Error handling for missing feature

---

### T7: MCP Tool — ingest_context

**Scenario**: Ingest context via MCP (from Cursor sidebar)

```bash
curl -X POST http://localhost:3001/mcp/call \
  -d '{
    "tool_name":"ingest_context",
    "arguments":{
      "source_type":"manual",
      "content":"The user needs to verify identity with SMS before accessing sensitive data",
      "feature_name":"user-authentication",
      "source_url":"internal-notes"
    }
  }'

Expected:
- Context ingested successfully
- Context ID returned
- Graph link created
- Vector stored
```

**Assertions**:
- [ ] Returns success status
- [ ] Context ID unique
- [ ] Retrievable via fetch_spec

---

### T8: Landing Page

**Scenario**: Visit landing page, verify design + narrative

```
GET https://jobshot.dev/  (production URL, or localhost:3000)

Visual checks:
- Hero section visible (text + CTA)
- 4-layer spec cards animated
- Before/after example shows real transformation
- MCP integration callout present
- "Try Demo" CTA smooth-scrolls to demo
- Footer has Privacy, Terms, Contact links
- Responsive design (mobile 320px, tablet 768px, desktop 1280px)
```

**Assertions**:
- [ ] Page loads in <2s (First Contentful Paint)
- [ ] Hero headline visible above fold
- [ ] Animation FPS >= 30 (smooth)
- [ ] No console errors
- [ ] All links functional
- [ ] Accessibility: WCAG 2.1 AA (semantic HTML, ARIA labels)

---

### T9: Demo Page (Full Workflow)

**Scenario**: User generates a real spec in the demo

```
1. Visit /demo
2. Paste raw input: "Users complain auth takes too long"
3. Select source: "Manual"
4. Click "Generate Spec"
5. Watch streaming progress
6. View output in tabs (Narrative, Evidence, Constraints, Gherkin)
7. Export as Markdown
8. Connect to Cursor (copy setup instructions)
```

**Assertions**:
- [ ] Input accepts multi-line text
- [ ] Generate button triggers API call
- [ ] Progress display updates (Harvesting → Drafting → Reviewing → Compiling → Simulating)
- [ ] Output tabs all contain data
- [ ] Narrative is readable English
- [ ] Constraints formatted as cards
- [ ] Gherkin is syntax-highlighted
- [ ] Export buttons work (copy to clipboard, download file)
- [ ] Cursor setup modal displays MCP config

---

### T10: Dashboard Feature List

**Scenario**: User sees all features with status badges

```
GET /dashboard

Visual checks:
- Feature table visible
- Status badges: No Spec (gray), Draft (yellow), Simulated (blue), Approved (green)
- Search box functional
- Create Feature button present
- Each row clickable
```

**Assertions**:
- [ ] All features listed
- [ ] Status badges correct color/text
- [ ] Search filters results
- [ ] Pagination works (if >20 features)
- [ ] Create button opens form

---

### T11: Feature Detail + Traceability

**Scenario**: User clicks on a feature to see full spec + evidence

```
GET /dashboard/features/auth-v1

Visual checks:
- Spec displayed in tabs (Narrative, Evidence, Constraints, Gherkin)
- Traceability graph shows:
  - "Requirement: 2FA via SMS" → links to Slack quote
  - "Constraint: DO NOT store plaintext" → links to security guideline
- Version history sidebar (v1, v2 if approved)
- Approve button (if status='simulated')
- Re-generate button (if want v2)
```

**Assertions**:
- [ ] All spec layers visible
- [ ] Graph nodes clickable
- [ ] Evidence links work
- [ ] Approve button updates status
- [ ] Re-generate creates version history

---

### T12: Context Ingest Form (Multi-Step)

**Scenario**: User ingests context via web form

```
Step 1: Select Feature
Step 2: Select Source Type (Slack, Jira, Notion, Transcript, Manual)
Step 3: Paste Content
Step 4: Preview Chunks (show how text will be split)
Step 5: Confirm & Submit
```

**Assertions**:
- [ ] Form validates each step
- [ ] Back/Next buttons work
- [ ] Chunk preview accurate
- [ ] Submit creates context record
- [ ] Success notification shown

---

## Error Cases

### E1: Missing API Key
```
POST /api/specs/generate (no CF Workers AI key)
Expected: Fallback to mock embeddings, warn in logs
```

### E2: Database Connection Error
```
POST /api/context/ingest (DB down)
Expected: 500 error, clear message, logged to audit_log
```

### E3: Invalid Spec (No Gherkin Tests)
```
POST /api/specs/simulate (spec without verification layer)
Expected: 400 error, detailed message about missing tests
```

### E4: MCP Tool Not Found
```
POST /mcp/call (tool_name="invalid_tool")
Expected: 404 error, list of available tools
```

---

## Performance Targets

| Operation | Target | Acceptance |
|-----------|--------|-----------|
| Ingest context | <1s | ≤2s |
| Generate spec (small) | <10s | ≤20s |
| Generate spec (large) | <30s | ≤60s |
| Simulate | <5s | ≤10s |
| Export | <1s | ≤2s |
| MCP tool call | <2s | ≤5s |
| Page load | <2s | <3s |

---

## Rollback Criteria

If any of these fail, **rollback and fix before shipping**:
- [ ] Build fails (`npm run build`)
- [ ] TypeScript errors (`npx tsc --noEmit`)
- [ ] Core tests fail (`npm run test`)
- [ ] MCP server won't start
- [ ] Database migrations fail
- [ ] API returns 5xx errors consistently
- [ ] Landing page doesn't load

---

## Sign-Off Checklist

- [ ] All 12 test cases pass
- [ ] No console errors in browser
- [ ] No errors in server logs
- [ ] Git history clean (all commits have messages)
- [ ] Deployment checklist complete
- [ ] README updated with new features
- [ ] CHANGELOG entries added
- [ ] Demo data created (sample specs for testing)

---

## Next Steps (Post-Testing)

1. **Deploy to Vercel** (`vercel --prod`)
2. **Smoke Test on Production** (run T1-T12 against live URL)
3. **Set up Monitoring** (error tracking, performance metrics)
4. **Create Beta Onboarding** (for first concierge customers)
5. **Launch r/developersIndia Post** (if ready)

---

**Status**: Ready to execute ~03:00 IST  
**Estimated Duration**: 1-2 hours (all test cases)  
**Parallel Execution**: Yes (multiple browsers/terminals)
