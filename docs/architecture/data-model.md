# Data Model: The Reasoning Engine

**Last Updated:** 2026-02-09  
**Status:** Conceptual Design

---

## Overview

The Reasoning Engine data model is designed around three core principles:

1. **Temporal Awareness:** Every entity is timestamped; relevance decays over time
2. **Relationship-First:** Connections between entities are as important as the entities themselves
3. **Immutability:** Approved specs are snapshots (never edited, only versioned)

---

## Entity-Relationship Diagram (High-Level)

```
┌─────────────┐       ┌──────────────┐       ┌─────────────┐
│   Tenant    │──────<│   User       │>──────│   Spec      │
└─────────────┘       └──────────────┘       └─────────────┘
                             │                       │
                             │                       │
                             ▼                       ▼
                      ┌──────────────┐       ┌─────────────┐
                      │   Agent      │       │  Context    │
                      │              │       │  Pointer    │
                      └──────────────┘       └─────────────┘
                                                     │
                                                     │
                             ┌───────────────────────┘
                             │
                             ▼
                      ┌──────────────┐
                      │  External    │
                      │  Event       │
                      │ (Slack, etc) │
                      └──────────────┘

┌─────────────┐       ┌──────────────┐       ┌─────────────┐
│ Constraint  │──────<│   Spec       │>──────│  Simulation │
└─────────────┘       └──────────────┘       └─────────────┘
```

---

## Core Entities (PostgreSQL)

### 1. Tenant

Multi-tenancy boundary. All data scoped to tenant.

```sql
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,  -- e.g., 'acme-corp'
  
  -- Subscription
  plan VARCHAR(50) DEFAULT 'free',  -- free, pro, enterprise
  status VARCHAR(50) DEFAULT 'active',  -- active, suspended, churned
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  settings JSONB DEFAULT '{}'::jsonb  -- tenant-specific config
);

CREATE INDEX idx_tenants_slug ON tenants(slug);
```

---

### 2. User

Human users of the system.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Identity
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  avatar_url TEXT,
  
  -- Auth (if managing ourselves; otherwise use Clerk/Auth0)
  password_hash VARCHAR(255),  -- bcrypt
  
  -- Role-Based Access Control
  role VARCHAR(50) DEFAULT 'viewer',  -- admin, pm, engineer, viewer
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  preferences JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_users_email ON users(email);
```

---

### 3. Spec (Executable Specification)

The core entity. Represents a versioned product spec.

```sql
CREATE TABLE specs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Versioning
  spec_id VARCHAR(100) NOT NULL,  -- Logical ID (e.g., 'dark-mode')
  version VARCHAR(20) NOT NULL,   -- Semantic version (e.g., '1.0', '1.1')
  parent_id UUID REFERENCES specs(id),  -- Previous version
  
  -- Status
  status VARCHAR(50) DEFAULT 'draft',  -- draft, approved, implemented, deprecated
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  
  -- Content (Four Layers)
  narrative JSONB NOT NULL,        -- { title, objective, rationale }
  context_pointers JSONB DEFAULT '[]'::jsonb,  -- Array of pointers
  constraints JSONB DEFAULT '[]'::jsonb,       -- Array of rules
  verification JSONB DEFAULT '[]'::jsonb,      -- Array of test scenarios
  
  -- Metadata
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  tags TEXT[] DEFAULT '{}'  -- e.g., ['ux', 'security', 'p0']
);

-- Enforce uniqueness: (tenant, spec_id, version)
CREATE UNIQUE INDEX idx_specs_tenant_spec_version 
  ON specs(tenant_id, spec_id, version);

CREATE INDEX idx_specs_status ON specs(tenant_id, status);
CREATE INDEX idx_specs_created_at ON specs(created_at DESC);
```

**Example Row:**
```json
{
  "id": "a1b2c3d4-...",
  "tenant_id": "tenant-uuid",
  "spec_id": "dark-mode",
  "version": "1.0",
  "status": "approved",
  "narrative": {
    "title": "Dark Mode Support",
    "objective": "Reduce eye strain for late-night users",
    "rationale": "15 customer requests in last 30 days"
  },
  "context_pointers": [
    {
      "source": "slack://C1234567890/p1234567890123456",
      "timestamp": "2026-01-15T10:20:00Z",
      "excerpt": "I work nights, bright screens hurt"
    },
    {
      "source": "github://org/repo/blob/main/docs/brand.md#colors",
      "section": "colors",
      "rule": "Brand Blue must never be inverted"
    }
  ],
  "constraints": [
    {
      "id": "C1",
      "rule": "DO NOT invert Brand Blue (#0066CC)",
      "source": "brand_guidelines.pdf",
      "severity": "critical"
    }
  ],
  "verification": [
    {
      "scenario": "User toggles dark mode",
      "given": "User is logged in",
      "when": "User clicks dark mode toggle",
      "then": [
        "All text is readable (contrast >= 4.5:1)",
        "Brand Blue remains #0066CC"
      ]
    }
  ]
}
```

---

### 4. Context Pointer

Links between specs and external data sources. Enables "living specs."

```sql
CREATE TABLE context_pointers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  spec_id UUID NOT NULL REFERENCES specs(id) ON DELETE CASCADE,
  
  -- Source Info
  source_type VARCHAR(50) NOT NULL,  -- slack, github, jira, notion, etc.
  source_url TEXT NOT NULL,          -- slack://..., github://...
  source_id VARCHAR(255),            -- ID in source system
  
  -- Content
  excerpt TEXT,                      -- Snippet of relevant text
  metadata JSONB DEFAULT '{}'::jsonb,  -- Source-specific fields
  
  -- Temporal
  source_timestamp TIMESTAMPTZ,     -- When the source data was created
  indexed_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Validation
  is_valid BOOLEAN DEFAULT true,    -- False if source no longer exists
  last_validated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_context_pointers_spec ON context_pointers(spec_id);
CREATE INDEX idx_context_pointers_source ON context_pointers(tenant_id, source_type);
```

---

### 5. Constraint

Explicit rules that must be enforced during implementation.

```sql
CREATE TABLE constraints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  spec_id UUID NOT NULL REFERENCES specs(id) ON DELETE CASCADE,
  
  -- Rule
  constraint_id VARCHAR(100) NOT NULL,  -- e.g., 'C1', 'C2'
  rule TEXT NOT NULL,                   -- e.g., 'DO NOT modify users table'
  rationale TEXT,                       -- Why this constraint exists
  
  -- Severity
  severity VARCHAR(50) DEFAULT 'warning',  -- critical, warning, info
  
  -- Source
  source_url TEXT,  -- Where this constraint came from
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_constraints_spec ON constraints(spec_id);
CREATE INDEX idx_constraints_severity ON constraints(tenant_id, severity);
```

---

### 6. Simulation

Result of "pre-code testing" (Virtual User simulation).

```sql
CREATE TABLE simulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  spec_id UUID NOT NULL REFERENCES specs(id) ON DELETE CASCADE,
  
  -- Execution
  status VARCHAR(50) DEFAULT 'pending',  -- pending, running, success, failure
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  -- Results
  scenarios_total INT,
  scenarios_passed INT,
  scenarios_failed INT,
  
  failures JSONB DEFAULT '[]'::jsonb,  -- Array of { scenario, step, failure }
  suggestions JSONB DEFAULT '[]'::jsonb,  -- AI-generated improvements
  
  -- Metadata
  model VARCHAR(100),  -- e.g., 'claude-opus-4-5'
  cost_usd DECIMAL(10, 4)  -- LLM cost for this simulation
);

CREATE INDEX idx_simulations_spec ON simulations(spec_id);
CREATE INDEX idx_simulations_status ON simulations(tenant_id, status);
```

---

### 7. Agent

AI agents or human users acting in the system.

```sql
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Agent Info
  agent_type VARCHAR(50) NOT NULL,  -- pm, architect, engineer, qa, ops, orchestrator
  name VARCHAR(255),
  
  -- Model Config
  model VARCHAR(100),  -- e.g., 'claude-opus-4-5'
  thinking_level VARCHAR(20),  -- off, low, medium, high
  
  -- Status
  status VARCHAR(50) DEFAULT 'idle',  -- idle, working, completed, failed
  current_task_id UUID,  -- Reference to task/spec being worked on
  
  -- Session
  session_id VARCHAR(255),  -- OpenClaw session ID
  spawned_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Metadata
  config JSONB DEFAULT '{}'::jsonb  -- Agent-specific settings
);

CREATE INDEX idx_agents_tenant ON agents(tenant_id);
CREATE INDEX idx_agents_status ON agents(status);
```

---

### 8. External Event

Raw events ingested from external systems (Slack, GitHub, etc.).

```sql
CREATE TABLE external_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Source
  source_type VARCHAR(50) NOT NULL,  -- slack, github, jira, notion, etc.
  source_id VARCHAR(255) NOT NULL,   -- ID in source system
  
  -- Event Type
  event_type VARCHAR(100) NOT NULL,  -- message, commit, issue_update, etc.
  
  -- Content
  content TEXT,  -- Main text content
  metadata JSONB DEFAULT '{}'::jsonb,  -- Source-specific fields
  
  -- Author
  author_id VARCHAR(255),  -- User ID in source system
  author_name VARCHAR(255),
  author_email VARCHAR(255),
  
  -- Temporal
  event_timestamp TIMESTAMPTZ NOT NULL,  -- When event occurred in source
  ingested_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Processing
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMPTZ
);

CREATE INDEX idx_external_events_tenant ON external_events(tenant_id);
CREATE INDEX idx_external_events_source ON external_events(source_type, source_id);
CREATE INDEX idx_external_events_timestamp ON external_events(event_timestamp DESC);
CREATE INDEX idx_external_events_processed ON external_events(processed) WHERE NOT processed;
```

---

### 9. Audit Log

Full audit trail of all actions.

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Actor
  user_id UUID REFERENCES users(id),  -- Nullable if action by system/agent
  agent_id UUID REFERENCES agents(id),
  
  -- Action
  action VARCHAR(100) NOT NULL,  -- spec.create, spec.approve, agent.spawn, etc.
  entity_type VARCHAR(50),       -- spec, constraint, simulation, etc.
  entity_id UUID,
  
  -- Details
  details JSONB DEFAULT '{}'::jsonb,  -- Action-specific metadata
  
  -- Context
  ip_address INET,
  user_agent TEXT,
  
  -- Temporal
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_tenant ON audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
```

---

## Graph Database (Neo4j)

For relationship reasoning (not just semantic similarity).

### Node Types

#### Feature
```cypher
CREATE (f:Feature {
  id: 'uuid',
  tenant_id: 'uuid',
  name: 'Dark Mode',
  status: 'implemented'
})
```

#### Ticket (Jira/Linear/etc.)
```cypher
CREATE (t:Ticket {
  id: 'uuid',
  tenant_id: 'uuid',
  source_type: 'jira',
  source_id: 'PROJ-123',
  title: 'Add dark mode toggle',
  status: 'done'
})
```

#### Commit
```cypher
CREATE (c:Commit {
  id: 'uuid',
  tenant_id: 'uuid',
  sha: 'a4f3b21',
  message: 'Implement dark mode',
  timestamp: datetime()
})
```

#### File
```cypher
CREATE (f:File {
  id: 'uuid',
  tenant_id: 'uuid',
  path: 'src/components/ThemeToggle.tsx',
  repo: 'org/repo'
})
```

#### User
```cypher
CREATE (u:User {
  id: 'uuid',
  tenant_id: 'uuid',
  name: 'Alice',
  email: 'alice@example.com'
})
```

### Relationship Types

#### IMPLEMENTS
```cypher
(ticket:Ticket)-[:IMPLEMENTS]->(feature:Feature)
(commit:Commit)-[:IMPLEMENTS]->(ticket:Ticket)
```

#### MODIFIES
```cypher
(commit:Commit)-[:MODIFIES]->(file:File)
```

#### DEPENDS_ON
```cypher
(feature:Feature)-[:DEPENDS_ON]->(service:Service)
(file:File)-[:DEPENDS_ON]->(library:Library)
```

#### BLOCKED_BY
```cypher
(ticket:Ticket)-[:BLOCKED_BY]->(ticket:Ticket)
```

#### REQUESTED_BY
```cypher
(feature:Feature)-[:REQUESTED_BY]->(user:User)
```

#### AUTHORED_BY
```cypher
(commit:Commit)-[:AUTHORED_BY]->(user:User)
```

### Example Query: "Why is login broken?"

```cypher
MATCH (feature:Feature {name: 'Login'})
      -[:IMPLEMENTED_BY]->(commit:Commit)
      -[:MODIFIES]->(file:File)
      -[:DEPENDS_ON]->(service:Service {name: 'Auth'})
WHERE commit.timestamp > datetime() - duration('P7D')  -- Last 7 days
RETURN feature, commit, file, service
ORDER BY commit.timestamp DESC
```

Returns the **causal chain**: Login feature → recent commits → modified files → dependent services.

---

## Vector Database (Pinecone/Weaviate)

For semantic search over unstructured text.

### Index Schema

```typescript
interface VectorDocument {
  id: string;                    // UUID
  tenant_id: string;             // Multi-tenancy
  
  // Content
  text: string;                  // Main searchable text
  embedding: number[];           // 1536-dimensional vector (OpenAI ada-002)
  
  // Metadata (for filtering)
  metadata: {
    type: 'slack_message' | 'github_commit' | 'jira_ticket' | 'notion_doc' | ...;
    source_id: string;           // ID in source system
    timestamp: number;           // Unix timestamp (for temporal decay)
    author: string;
    tags?: string[];
  };
}
```

### Example Query

```typescript
const results = await vectorDB.query({
  vector: embed("dark mode customer feedback"),
  filter: {
    tenant_id: 'acme-corp',
    type: { $in: ['slack_message', 'zendesk_ticket'] },
    timestamp: { $gte: Date.now() - 30 * 24 * 60 * 60 * 1000 }  // Last 30 days
  },
  topK: 20
});
```

---

## Cache Layer (Redis)

For frequently accessed data.

### Key Patterns

```
# User session
session:{user_id} → { tenant_id, role, preferences }

# Spec cache
spec:{tenant_id}:{spec_id}:{version} → JSON

# Context search cache
context:{tenant_id}:{query_hash} → [context_pointer_ids]

# Rate limiting
ratelimit:{tenant_id}:{endpoint} → counter (TTL 1 hour)
```

---

## Data Flow Example: "Create Spec"

1. **User writes narrative in editor:**
   - Frontend sends: `POST /api/specs`
   - Payload: `{ spec_id: 'dark-mode', narrative: {...} }`

2. **Backend (Spec Compiler):**
   ```typescript
   // Insert into PostgreSQL
   const spec = await db.specs.insert({
     tenant_id: user.tenant_id,
     spec_id: 'dark-mode',
     version: '1.0',
     narrative: payload.narrative,
     status: 'draft',
     created_by: user.id,
   });
   
   // RAG: Find relevant context
   const context = await hybridSearch({
     query: payload.narrative.title,
     tenant_id: user.tenant_id,
   });
   
   // Update spec with context pointers
   await db.specs.update(spec.id, {
     context_pointers: context.map(c => ({
       source_url: c.url,
       excerpt: c.text.slice(0, 200),
       source_timestamp: c.timestamp,
     })),
   });
   
   // Index in graph
   await graphDB.run(`
     CREATE (s:Spec {
       id: $spec_id,
       tenant_id: $tenant_id,
       name: $name
     })
   `, { spec_id: spec.id, tenant_id: user.tenant_id, name: 'Dark Mode' });
   
   // Audit log
   await db.audit_logs.insert({
     tenant_id: user.tenant_id,
     user_id: user.id,
     action: 'spec.create',
     entity_type: 'spec',
     entity_id: spec.id,
   });
   ```

3. **Response to frontend:**
   ```json
   {
     "spec_id": "a1b2c3d4-...",
     "status": "draft",
     "context_found": 15,
     "next_steps": ["Review context pointers", "Run simulation"]
   }
   ```

---

## Migrations & Versioning

Use a migration tool (e.g., Drizzle, Prisma, or raw SQL migrations).

**Example Migration: Add `tags` to specs**

```sql
-- migrations/20260209_add_spec_tags.sql

ALTER TABLE specs ADD COLUMN tags TEXT[] DEFAULT '{}';

CREATE INDEX idx_specs_tags ON specs USING GIN(tags);
```

---

## Performance Considerations

### Indexing Strategy
- **Hot paths:** Index on `tenant_id`, `status`, `created_at`
- **Full-text search:** Use PostgreSQL `tsvector` for spec narrative search (fallback before vector DB)
- **Graph queries:** Index on node properties (`tenant_id`, `timestamp`)

### Partitioning (Future)
If data grows large:
- Partition `external_events` by `event_timestamp` (monthly partitions)
- Partition `audit_logs` by `timestamp` (monthly partitions)

### Archival
- Move old events (> 1 year) to cold storage (S3/GCS)
- Keep spec history indefinitely (audit requirement)

---

## Conclusion

This data model balances:
- **Simplicity:** Core entities in PostgreSQL (familiar, transactional)
- **Power:** Graph DB for causal reasoning, Vector DB for semantic search
- **Performance:** Redis caching, indexing strategy
- **Compliance:** Audit logs, immutability, RBAC

It's designed to evolve: start simple (Phase 1), add complexity as needed (Phase 2+).

---

*Data models are living documents. Update as schemas evolve.*
