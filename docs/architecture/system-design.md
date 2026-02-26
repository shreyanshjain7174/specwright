# System Design: The Reasoning Engine

**Last Updated:** 2026-02-09  
**Author:** Shreyansh + Goody (AI Architect)  
**Status:** Conceptual Design

---

## Executive Summary

The Reasoning Engine is a **Context Intelligence Platform** that sits between chaotic human intent (Slack threads, customer calls, tribal knowledge) and precise machine execution (AI coding agents). It synthesizes unstructured context into **Executable Specifications** — structured, time-aware, relationship-modeled prompts that serve as ground truth for the AI workforce.

**Core Insight:** As code generation becomes commoditized, the bottleneck shifts to **specification fidelity**. This system solves the "Garbage In, Garbage Out" crisis by ensuring AI agents receive high-fidelity, context-grounded instructions.

---

## System Context

### The Problem Space

**Current State:**
```
Customer Feedback → Salesforce (siloed)
                  ↓
Product Ideas → Notion (static docs, no links)
                  ↓
Eng Tickets → Jira (context-free)
                  ↓
Code → GitHub (disconnected from intent)
```

**Failure Mode:**
- Engineer implements Jira ticket "Add dark mode"
- Ticket is vague (no constraints, no context)
- Engineer uses generic CSS inversion
- Result: Brand Blue becomes inverted (violates brand guidelines), Charts become invisible (library limitation)
- Feature "works" syntactically but is productively broken

**Root Cause:** Context fragmentation. No system connects feedback → constraints → implementation.

### The Opportunity

**AI-Driven Future:**
```
Customer Feedback → Reasoning Engine (unified graph)
                  ↓
Executable Spec → (Narrative + Context + Constraints + Tests)
                  ↓
AI Coding Agent → Perfect Implementation (grounded in reality)
```

**Value Proposition:**
1. **For Startups:** 10x velocity (eliminate "telephone game" latency)
2. **For Enterprises:** Compliance & governance (audit trail from feedback to code)

---

## Architectural Principles

### 1. Context as First-Class Citizen
Every piece of data is:
- **Versioned** (immutable snapshots)
- **Timestamped** (temporal decay for relevance)
- **Linked** (graph relationships, not just semantic similarity)

### 2. Executable > Readable
Documents are not endpoints; they are **prompts** for machines.

Traditional PRD:
```markdown
## Feature: Dark Mode
The system should support dark mode for better accessibility.
```

Executable Spec:
```yaml
narrative: "Support dark mode for enterprise users (WCAG AA compliance)"
context:
  - customer_request: "interview_transcript_04.json#timestamp:04:20"
  - brand_guide: "brand_guidelines.pdf#section:colors"
  - technical_constraint: "charts_library_v4_limitations.md"
constraints:
  - "DO NOT invert Brand Blue (#0066CC) - must remain unchanged"
  - "DO ensure text contrast ratio >= 4.5:1 (WCAG AA)"
  - "DO upgrade Charts library to v5 OR implement custom backgrounds"
verification:
  - scenario: "Given user enables dark mode, When viewing dashboard, Then all text is readable (contrast check passes)"
  - scenario: "Given dark mode enabled, When brand elements render, Then Brand Blue remains #0066CC"
```

### 3. Human-in-the-Loop (Progressive Trust)
```
Phase 1 (Now):       AI Draft → Human Review → Human Approve → AI Execute
Phase 2 (6 months):  AI Draft → Human Approve → AI Execute
Phase 3 (1 year):    AI Draft → AI Execute → Human Audit (post-facto)
```

Start with augmentation, graduate to automation as trust builds.

### 4. Protocol-Native (Interoperability First)
Build on open standards:
- **MCP (Model Context Protocol):** Let any IDE pull our specs
- **A2A (Agent-to-Agent):** Let any coding agent accept our orchestration

Avoid vendor lock-in. Be the "context layer" for the ecosystem.

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                             │
│  - Web App (Next.js, React)                                 │
│  - CLI Tool (Node.js, TypeScript)                           │
│  - IDE Extensions (VS Code API, Cursor MCP)                 │
└─────────────────────────────────────────────────────────────┘
                           ↓ HTTPS / WebSocket
┌─────────────────────────────────────────────────────────────┐
│                    API GATEWAY                              │
│  - Authentication (Clerk SSO, JWT)                          │
│  - Rate Limiting (Redis)                                    │
│  - Request Routing (tRPC or GraphQL)                        │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                  APPLICATION LAYER                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Spec Compiler Service                              │   │
│  │  - Parse narrative (LLM)                            │   │
│  │  - Resolve context pointers (RAG)                   │   │
│  │  - Validate constraints (rule engine)               │   │
│  │  - Generate tests (Gherkin synthesis)               │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Simulator Service                                  │   │
│  │  - Spin up Virtual User (LLM persona)               │   │
│  │  - Execute spec mentally                            │   │
│  │  - Report ambiguities/failures                      │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Drift Detector Service                             │   │
│  │  - Watch codebase for changes (webhooks)            │   │
│  │  - Compare spec refs to current state               │   │
│  │  - Alert on divergence                              │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Orchestrator Service (A2A Protocol)                │   │
│  │  - Broadcast "Implementation Request"               │   │
│  │  - Negotiate with coding agents (Devin, etc.)       │   │
│  │  - Monitor execution, collect results               │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                  DATA LAYER                                 │
│  ┌───────────────────┬────────────────┬──────────────────┐ │
│  │  PostgreSQL       │  Vector DB     │  Graph DB        │ │
│  │  (Primary data)   │  (Embeddings)  │  (Relationships) │ │
│  │  - Users, Orgs    │  - Docs        │  - Nodes:        │ │
│  │  - Specs (meta)   │  - Transcripts │    Feature,      │ │
│  │  - Audit logs     │  - Code        │    Ticket,       │ │
│  │                   │                │    Commit, User  │ │
│  │                   │                │  - Edges:        │ │
│  │                   │                │    IMPLEMENTS,   │ │
│  │                   │                │    BLOCKED_BY,   │ │
│  │                   │                │    REQUESTED_BY  │ │
│  └───────────────────┴────────────────┴──────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                  INGESTION LAYER                            │
│  - Unified.to (Universal API: Slack, Jira, Notion, etc.)   │
│  - Webhooks (GitHub, Linear)                                │
│  - ETL Pipelines (scheduled + real-time)                    │
│  - Multi-Tenant Isolation (namespace per org)               │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                  EXTERNAL SYSTEMS                           │
│  Slack, GitHub, Jira, Notion, Salesforce, Zendesk, Gong... │
└─────────────────────────────────────────────────────────────┘
```

---

## Component Deep Dives

### 1. Ingestion Layer

**Objective:** Pull data from siloed SaaS tools in real-time or near-real-time.

**Challenges:**
- 350+ SaaS tools, each with different auth, rate limits, schemas
- Need both historical data (backfill) and live updates (CDC)
- Multi-tenancy: Customer A's Slack data ≠ Customer B's

**Solution: Unified.to + Custom Webhooks**

```typescript
// Pseudo-code: Ingestion Pipeline
const ingestPipeline = {
  sources: [
    { type: 'slack', mode: 'webhook', events: ['message.channels', 'message.groups'] },
    { type: 'github', mode: 'webhook', events: ['push', 'pull_request', 'issues'] },
    { type: 'jira', mode: 'webhook', events: ['issue_updated', 'issue_created'] },
    { type: 'notion', mode: 'poll', interval: '1h' },  // Notion doesn't have great webhooks
    { type: 'gong', mode: 'poll', interval: '24h' },  // Transcripts don't change often
  ],
  
  processors: [
    normalizationProcessor,   // Convert to internal schema
    deduplicationProcessor,   // Avoid duplicate events
    enrichmentProcessor,      // Add metadata (timestamps, user info)
    vectorizationProcessor,   // Generate embeddings
    graphIndexingProcessor,   // Create/update graph nodes/edges
  ],
  
  outputs: [
    { type: 'postgres', table: 'raw_events' },
    { type: 'vector_db', collection: 'documents' },
    { type: 'graph_db', label: 'Event' },
  ],
};
```

**Data Normalization:**
All sources map to a unified schema:

```typescript
interface UnifiedEvent {
  id: string;                    // Global unique ID
  tenant_id: string;             // Multi-tenancy
  source: 'slack' | 'github' | 'jira' | ...;
  source_id: string;             // ID in source system
  type: 'message' | 'commit' | 'ticket' | ...;
  timestamp: Date;
  author: { id: string, name: string, email?: string };
  content: string;               // Main text
  metadata: Record<string, any>; // Source-specific fields
  relationships: Array<{         // Links to other events
    type: 'mentions' | 'implements' | 'blocks' | ...;
    target_id: string;
  }>;
}
```

**Multi-Tenant Isolation:**
- PostgreSQL: Row-Level Security (RLS) with `tenant_id` column
- Vector DB: Namespace per tenant (Pinecone) or filter metadata (Weaviate)
- Graph DB: Separate graph per tenant (Neo4j) or labeled nodes (Memgraph)

---

### 2. Context Engine (The "Brain")

**Objective:** Given a query (e.g., "Why is login broken?"), return the most relevant context from ALL sources.

**Challenge:** Pure vector search is insufficient.

**Example Failure:**
```
Query: "Why is login broken?"
Vector Search Returns: 
  - Doc about "How to implement OAuth" (high semantic similarity)
  - Slack message: "Login seems slow today"

MISSING:
  - The GitHub commit that changed the Auth Service yesterday
  - The Jira ticket tracking the migration to new auth library
  - The constraint doc saying "Do not modify users table schema"
```

**Solution: Hybrid Search (Vector + Graph)**

#### Vector Search (Semantic)
```cypher
-- Pseudo-query in vector DB
SEARCH documents
WHERE embedding SIMILAR TO embed("Why is login broken?")
LIMIT 20
ORDER BY relevance DESC
```

Returns: Docs, transcripts, code comments with semantic similarity.

#### Graph Search (Causal)
```cypher
-- Pseudo-query in Neo4j
MATCH (feature:Feature {name: 'Login'})
      -[:IMPLEMENTED_BY]->(commit:Commit)
      -[:MODIFIED]->(file:File)
      -[:DEPENDS_ON]->(service:Service {name: 'Auth'})
WHERE commit.timestamp > (NOW() - 7 days)
RETURN feature, commit, file, service
ORDER BY commit.timestamp DESC
```

Returns: The CHAIN of causality (Login → Commit → File → Service).

#### Temporal Decay
Older context is less relevant. Apply decay function:

```typescript
function temporalRelevance(baseScore: number, timestamp: Date): number {
  const ageInDays = (Date.now() - timestamp.getTime()) / (1000 * 60 * 60 * 24);
  
  // Exponential decay with 30-day half-life
  const decayFactor = Math.exp(-Math.log(2) * ageInDays / 30);
  
  return baseScore * decayFactor;
}
```

Result: A doc from 6 months ago with 90% similarity might score lower than a doc from yesterday with 70% similarity.

#### Fusion
```typescript
function hybridSearch(query: string): Array<ContextItem> {
  const vectorResults = vectorDB.search(query, limit: 50);
  const graphResults = graphDB.traverse(query, depth: 3);
  
  // Merge and re-rank
  const merged = [...vectorResults, ...graphResults];
  const reranked = merged.map(item => ({
    ...item,
    finalScore: item.score * temporalRelevance(item.score, item.timestamp),
  })).sort((a, b) => b.finalScore - a.finalScore);
  
  return reranked.slice(0, 20);  // Top 20
}
```

---

### 3. Spec Compiler Service

**Objective:** Convert human-written narrative into machine-executable spec.

**Input (Human PM writes in editor):**
```markdown
# Feature: Dark Mode

We need to add dark mode to reduce eye strain for users who work late nights.
Based on feedback from 15 customers in the last month.
```

**Process:**

1. **Parse Narrative (LLM):**
   ```typescript
   const parsed = await llm.complete({
     prompt: `Extract structured data from this feature request: ${narrative}`,
     schema: {
       title: 'string',
       objective: 'string',
       rationale: 'string',
       stakeholders: 'array',
     },
   });
   ```

2. **Resolve Context Pointers (RAG):**
   ```typescript
   const context = await hybridSearch("dark mode customer feedback");
   // Returns: 
   // - interview_transcript_04.json (Customer X: "I work nights, bright screens hurt")
   // - brand_guidelines.pdf (Section on color palette)
   // - charts_library_docs.md (Known limitation with transparent backgrounds)
   ```

3. **Validate Constraints (Rule Engine):**
   ```typescript
   const constraints = await constraintEngine.check({
     feature: 'dark mode',
     codebase: '/path/to/repo',
   });
   // Returns:
   // - "DO NOT modify Brand Blue (#0066CC)"
   // - "Charts library v4 has transparent bg issue - upgrade to v5"
   ```

4. **Generate Tests (Gherkin Synthesis):**
   ```typescript
   const tests = await llm.complete({
     prompt: `Generate Gherkin test scenarios for dark mode feature, considering: ${JSON.stringify(constraints)}`,
   });
   // Returns:
   // - "Given user enables dark mode, When..."
   ```

**Output (Executable Spec):**
```yaml
spec_id: "dark-mode-v1"
version: "1.0"
status: "draft"
narrative:
  title: "Dark Mode Support"
  objective: "Reduce eye strain for late-night users"
  rationale: "15 customer requests in last 30 days"
context_pointers:
  - source: "interview_transcript_04.json"
    timestamp: "2026-01-15T10:20:00Z"
    excerpt: "I work nights, bright screens hurt my eyes"
  - source: "brand_guidelines.pdf"
    section: "colors"
    rule: "Brand Blue must never be inverted"
constraints:
  - id: "C1"
    rule: "DO NOT invert Brand Blue (#0066CC)"
    source: "brand_guidelines.pdf"
  - id: "C2"
    rule: "Ensure text contrast ratio >= 4.5:1 (WCAG AA)"
    source: "accessibility_standards.md"
  - id: "C3"
    rule: "Upgrade Charts library to v5 OR implement custom backgrounds"
    source: "charts_library_docs.md"
verification:
  - scenario: "User toggles dark mode"
    given: "User is logged in"
    when: "User clicks dark mode toggle in settings"
    then:
      - "All text is readable (contrast >= 4.5:1)"
      - "Brand Blue remains #0066CC"
      - "Charts render correctly (no invisible text)"
```

---

### 4. Simulator Service (Pre-Code Testing)

**Objective:** Catch logic errors BEFORE implementation.

**Concept:** Spin up a "Virtual User" (LLM persona) that attempts to "use" the feature mentally.

**Process:**

1. **Load Spec:**
   ```typescript
   const spec = loadSpec('dark-mode-v1');
   ```

2. **Create Virtual User:**
   ```typescript
   const virtualUser = await llm.complete({
     prompt: `You are a user of our app. You will attempt to use a new feature described below. Report any ambiguities, missing steps, or failures. Feature: ${JSON.stringify(spec)}`,
     model: 'claude-opus',  // Needs high reasoning
   });
   ```

3. **Simulate Scenarios:**
   ```typescript
   for (const scenario of spec.verification) {
     const result = await virtualUser.simulate(scenario);
     if (!result.success) {
       report.failures.push({
         scenario: scenario.description,
         failure: result.error,
       });
     }
   }
   ```

**Example Output:**
```json
{
  "spec_id": "dark-mode-v1",
  "simulation_status": "FAILED",
  "failures": [
    {
      "scenario": "User toggles dark mode",
      "step": "Then charts render correctly",
      "failure": "Ambiguity detected: Spec does not specify what happens if user is viewing a chart at the moment they toggle. Does the chart re-render immediately or on next page load?"
    }
  ],
  "suggestions": [
    "Add constraint: Charts must re-render within 2 seconds of toggle"
  ]
}
```

**Value:** Catches UX gaps before code is written, saving engineering time.

---

### 5. Drift Detector Service

**Objective:** Keep specs in sync with codebase reality.

**Problem:** Specs become stale.

**Example:**
- Spec references `userAuth.service.ts`
- Engineer refactors and renames to `auth.service.ts`
- Spec now points to non-existent file

**Solution: Continuous Monitoring**

```typescript
// Listen to GitHub webhooks
webhookRouter.on('push', async (event) => {
  const changedFiles = event.commits.flatMap(c => c.modified);
  
  // Find specs that reference changed files
  const affectedSpecs = await db.query(`
    SELECT spec_id FROM specs
    WHERE context_pointers @> jsonb_build_array(
      jsonb_build_object('source', ANY($1))
    )
  `, [changedFiles]);
  
  // Validate each spec
  for (const spec of affectedSpecs) {
    const isValid = await validateSpec(spec);
    if (!isValid) {
      await notifyPM({
        spec_id: spec.spec_id,
        message: `Spec outdated due to commit ${event.commit.sha}. Please review.`,
      });
    }
  }
});
```

**Notification:**
```
🔔 Spec Drift Alert

Spec: "Dark Mode (v1.0)"
Issue: References file "userAuth.service.ts" which was renamed to "auth.service.ts" in commit a4f3b21
Action Required: Update context pointer or mark spec as deprecated
```

---

### 6. Protocol Layer (MCP & A2A)

**Objective:** Make specs consumable by external tools (IDEs, coding agents).

#### MCP Server (Model Context Protocol)

Expose specs as "context sources" for IDEs.

```typescript
// MCP Server Implementation
import { MCPServer } from '@anthropic/mcp-server';

const server = new MCPServer({
  name: 'reasoning-engine',
  version: '1.0.0',
  capabilities: ['context-provider'],
});

server.onContextRequest(async (request) => {
  if (request.query.startsWith('@spec:')) {
    const specId = request.query.replace('@spec:', '');
    const spec = await loadSpec(specId);
    return {
      type: 'document',
      content: YAML.stringify(spec),
      metadata: {
        title: spec.narrative.title,
        version: spec.version,
      },
    };
  }
});

server.listen({ port: 8080 });
```

**Usage in Cursor IDE:**
```typescript
// Developer in Cursor types:
// @spec:dark-mode implement this

// Cursor fetches spec via MCP, includes it in context window
const spec = await mcp.fetchContext('@spec:dark-mode');
// Now the coding agent has full spec in context
```

#### A2A Orchestrator (Agent-to-Agent)

Coordinate multiple coding agents.

```typescript
// Orchestrator broadcasts work
const implementationRequest = {
  protocol: 'A2A',
  request_type: 'implementation',
  spec_id: 'dark-mode-v1',
  spec_url: 'https://api.reasoning-engine.com/specs/dark-mode-v1.yaml',
  constraints: spec.constraints,
  deadline: '2026-02-10T18:00:00Z',
};

await a2a.broadcast(implementationRequest);

// Coding agents (Devin, etc.) respond
a2a.onResponse(async (response) => {
  if (response.status === 'accepted') {
    console.log(`Agent ${response.agent_id} accepted the work`);
    
    // Monitor progress
    const statusUpdate = await a2a.pollStatus(response.agent_id);
    if (statusUpdate === 'completed') {
      // Run QA Agent to verify
      await qaAgent.verify(response.pull_request_url);
    }
  }
});
```

---

## Data Models

See [data-model.md](./data-model.md) for detailed schemas.

**Core Entities:**
- **Spec:** The executable specification (versioned, immutable)
- **ContextPointer:** Link to external data (Slack message, GitHub file, etc.)
- **Constraint:** Rule that must be enforced
- **Simulation:** Result of pre-code testing
- **Agent:** Coding agent or human user
- **Event:** Any action in the system (spec created, agent spawned, etc.)

---

## Deployment Architecture

### Phase 1 (Concierge MVP)
```
Local Machine (Mac)
  ├─ Next.js App (localhost:3000)
  ├─ PostgreSQL (Docker)
  ├─ Redis (Docker)
  └─ LLM calls (Anthropic API)
```

### Phase 2 (CLI Tool)
```
Fly.io (Multi-Region)
  ├─ API Service (Node.js, Fly machines)
  ├─ PostgreSQL (Fly.io managed)
  ├─ Redis (Fly.io managed)
  ├─ Vector DB (Pinecone cloud)
  └─ Queue Workers (BullMQ on Fly machines)
```

### Phase 3 (Enterprise)
```
Multi-Region (AWS or GCP)
  ├─ API Gateway (ALB / Cloud Load Balancing)
  ├─ App Servers (Kubernetes, auto-scaling)
  ├─ PostgreSQL (RDS / Cloud SQL, replicas)
  ├─ Redis (ElastiCache / Memorystore)
  ├─ Vector DB (Pinecone / self-hosted Weaviate)
  ├─ Graph DB (Neo4j Aura / self-hosted)
  ├─ Object Storage (S3 / GCS for files)
  └─ Observability (DataDog / New Relic)
```

---

## Security & Compliance

### Authentication
- Phase 1: API keys (simple)
- Phase 2: OAuth 2.0 (Google, GitHub)
- Phase 3: SSO (SAML, Okta, Azure AD)

### Authorization
- Role-Based Access Control (RBAC)
  - Admin: Full access
  - PM: Create/edit specs
  - Engineer: Read specs, run simulations
  - Viewer: Read-only

### Data Privacy
- **Encryption:** 
  - At rest: AES-256 (database encryption)
  - In transit: TLS 1.3
- **Compliance:** SOC 2 Type II, GDPR, CCPA
- **Retention:** Configurable per-tenant (e.g., delete data after 90 days)

### Audit Trails
Every action logged:
```typescript
interface AuditLog {
  id: string;
  tenant_id: string;
  user_id: string;
  action: 'spec.create' | 'spec.approve' | 'agent.spawn' | ...;
  timestamp: Date;
  metadata: Record<string, any>;
}
```

---

## Performance & Scalability

### Latency Targets
- Spec generation: < 5 seconds (P95)
- Context search: < 500ms (P95)
- Simulation: < 30 seconds (P95)

### Throughput
- Phase 1: 10 concurrent users
- Phase 2: 1,000 concurrent users
- Phase 3: 10,000 concurrent users

### Scaling Strategy
- **Horizontal:** Add more app servers (stateless, behind load balancer)
- **Database:** Read replicas for queries, primary for writes
- **Caching:** Redis for frequently accessed specs, context
- **Queue:** BullMQ for async work (simulation, ingestion)

---

## Monitoring & Observability

### Metrics
- **API:** Request rate, latency (P50, P95, P99), error rate
- **Database:** Query time, connection pool usage
- **LLM:** Token usage, cost, latency
- **Queue:** Job queue depth, processing time

### Alerts
- Error rate > 1% for 5 minutes
- API latency P95 > 2 seconds
- Database connection pool > 80% full
- LLM cost spike > $100/hour

### Logging
- Structured logs (JSON)
- Centralized (Axiom / CloudWatch)
- Retention: 30 days

---

## Future Enhancements

### Phase 4+ (Post-PMF)
1. **Real-time Collaboration:** Google Docs-style multi-user editing of specs
2. **AI Code Review:** Verify that implemented code matches spec constraints
3. **Automated Regression Detection:** Run simulations on every PR
4. **Marketplace:** Let users share/sell Executable Spec templates
5. **Voice Interface:** "Hey Reasoning Engine, create a spec for dark mode" (speech-to-spec)

---

## Conclusion

The Reasoning Engine is not a CRUD app. It's a **cognitive infrastructure** for the AI-native era. By treating context as first-class, making specs executable, and leveraging hybrid search, we solve the "Garbage In, Garbage Out" crisis that plagues AI code generation.

This architecture is designed to scale from solo founder (Phase 1) to Fortune 500 (Phase 3) without requiring a full rewrite. Each phase builds on the previous, adding capability without discarding the core.

**Next Steps:**
1. Prototype the Spec Compiler (manual + LLM-assisted)
2. Build the Simulator (Virtual User testing)
3. Integrate MCP (so Cursor can pull specs)

---

*Architecture is never "done." Update this doc as we learn and evolve.*
