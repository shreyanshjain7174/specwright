# CLAUDE.md — AI Assistant Context for The Reasoning Engine

> **Purpose:** This file contains the complete context needed for AI assistants (Claude, GPT, Gemini) working on this project. Read this FIRST before contributing.

---

## Project Identity

**Name:** The Reasoning Engine (working title: "Cursor for PM")  
**Category:** AI-native product management platform / Context intelligence infrastructure  
**Stage:** Pre-seed conceptual → Concierge MVP  
**Founder:** Shreyansh (India, GMT+5:30, technical founder, ex-SaaS builder)

---

## What Are We Building?

### The One-Sentence Pitch
"Cursor for Product Management" — A context intelligence platform that transforms chaotic, unstructured product context into **Executable Specifications** that AI coding agents can implement without hallucinating.

### The Core Problem (Why Now?)

AI coding tools (Cursor, Windsurf, Claude Code) have made **writing code** nearly free. The bottleneck has shifted upstream to **defining what to build**. 

Current state:
- PMs write vague PRDs in Notion/Google Docs
- Context is scattered across Slack, Jira, Zendesk, GitHub, Gong calls
- AI agents receive low-fidelity instructions → hallucinate features that "work" but are productively wrong
- Manual "telephone game" between customer insight → spec → code is the primary bottleneck

**The Crisis:** "Garbage In, Garbage Out" at industrial scale.

### The Solution

An **Executable Specification** platform with four layers:

1. **Narrative Layer** (human-readable): "Why we're building this"
2. **Context Pointer Layer** (RAG-enabled): Links to interview transcripts, API schemas, constraints
3. **Constraint Layer** (rule-based): "DO NOT modify users table", "Latency < 200ms"
4. **Verification Layer** (test-driven): Gherkin syntax Given/When/Then acceptance tests

The system **synthesizes context** from siloed tools into a single, machine-readable source of truth.

---

## Technical Architecture (High-Level)

```
┌───────────────────────────────────────────────────────────┐
│                    USER INTERFACE                         │
│  - Web Editor (IDE for strategy)                          │
│  - CLI Tool (pm-cli for engineers)                        │
│  - IDE Extensions (VS Code, Cursor, Windsurf)             │
└───────────────────────────────────────────────────────────┘
                            ↓
┌───────────────────────────────────────────────────────────┐
│                  INGESTION LAYER                          │
│  - Unified.to (Universal API for 350+ SaaS tools)         │
│  - Webhooks (Slack, GitHub, Jira)                         │
│  - Change Data Capture (real-time streams)                │
│  - Multi-tenant isolation (PostgreSQL RLS)                │
└───────────────────────────────────────────────────────────┘
                            ↓
┌───────────────────────────────────────────────────────────┐
│                  CONTEXT ENGINE                           │
│  Vector Store (Pinecone/Weaviate): Semantic search        │
│  Knowledge Graph (Neo4j): Relationship reasoning          │
│  Temporal Index: Time-decay functions for relevance       │
└───────────────────────────────────────────────────────────┘
                            ↓
┌───────────────────────────────────────────────────────────┐
│                  REASONING LAYER                          │
│  Spec Compiler: Narrative → Executable Spec               │
│  Constraint Validator: Check against rules & codebase     │
│  Simulator: Virtual user testing pre-code                 │
│  Drift Detector: Alert when specs diverge from reality    │
└───────────────────────────────────────────────────────────┘
                            ↓
┌───────────────────────────────────────────────────────────┐
│                  PROTOCOL LAYER                           │
│  MCP Server: Expose specs to Cursor/IDE via MCP           │
│  A2A Orchestrator: Coordinate coding agents                │
│  Webhook Outbound: Notify Slack/Teams on spec changes     │
└───────────────────────────────────────────────────────────┘
```

---

## Key Concepts & Terminology

### Executable Specification
Not a static document. A living, linked, machine-readable instruction set with four layers (see above).

### Context Graveyard
Current tools (Notion, Jira, Salesforce) where information enters and dies. No connection between customer feedback → feature spec → code implementation.

### Hallucinated Feature
A feature that is syntactically correct (compiles, no errors) but productively wrong (doesn't solve the actual user problem, breaks brand guidelines, violates constraints).

### Temporal Context
Context decays over time. A user complaint from 2024 should weigh less than one from last week. Our system applies time-decay functions to relevance scoring.

### Hybrid Search
Combining **vector similarity** (semantic search) with **graph traversal** (relationship reasoning). Example: "Find the Jira ticket that implemented the login feature described in this Slack thread."

### Pre-Code Simulation
The "Run" button for specs. Spins up a Virtual User (LLM persona) that attempts to "use" the feature mentally, catching logic errors before code is written.

### MCP (Model Context Protocol)
The "USB-C for AI" — Anthropic's standard for how AI models access context. We build an MCP Server that lets Cursor/IDEs pull specs directly.

### A2A (Agent-to-Agent Protocol)
Google's protocol for agent coordination. Our Orchestrator Agent uses A2A to delegate implementation tasks to coding agents (Devin, etc.).

---

## Go-to-Market Strategy

### Phase 1: Concierge MVP ("Wizard of Oz") — Months 1-3

**Core Thesis:** Validate that "Executable Specs" are valuable enough that people will pay high-ticket prices BEFORE building automation.

**The Offer:**
- "We will manage your AI engineering backlog"
- "Send us raw brain dumps, Slack threads, customer calls"
- "We return fully tested, agent-ready Executable Specs"
- Pricing: $2,500–$5,000/month retainer

**Target Customer:**
- YC founders doing "vibe coding" (solo or 2-3 person teams)
- Seed-stage AI startups with technical capacity but zero bandwidth for product definition
- Pain point: Drowning in chaos, need structure without overhead

**Operations (Manual):**
1. Founder sends Loom video or voice note describing feature
2. We (Shreyansh + AI assistants) manually create the Spec using:
   - Otter.ai for transcription
   - Gemini 1.5 Pro for synthesis
   - Manual Gherkin test writing
   - Manual constraint extraction from their codebase
3. Deliver: Markdown file with all four layers + simulation report

**Why This Works:**
- **Cashflow:** Revenue from Day 1 (bootstrapped, no VC dependency)
- **Training Data:** We're building the "gold standard" dataset for later automation
- **Customer Intimacy:** We learn exactly where AI fails, what context is missing
- **Risk Mitigation:** If nobody pays, we haven't wasted 6 months building a SaaS nobody wants

**Success Metrics:**
- 5 paying customers @ $3k/month = $15k MRR
- 90% retention (they can't live without it)
- Founder testimonials: "This 10x'd our velocity"

### Phase 2: CLI Tool (pm-cli) — Months 4-9

**Transition:** Service → Software (but keep it simple)

**The Product:**
- Command-line tool: `pm-cli`
- Command: `pm spec create "dark mode"`
- Output: Generates draft Executable Spec in terminal/IDE
- Backend: Hooked up to our RAG pipeline (automated version of Phase 1)

**Distribution Strategy: "Trojan Horse"**
- Market it to **Engineers**, not PMs
- Pitch: "Stop getting bad tickets from PMs. Generate your own high-quality specs."
- Once engineers are addicted, they force PMs to adopt the interface

**Pricing:**
- Freemium: 10 specs/month free
- Pro: $50/month unlimited
- Team: $200/month (5 seats, SSO, Slack integration)

**Key Feature:** IDE Extensions
- VS Code / Cursor extension
- Inline spec generation: Select code → right-click → "Generate spec from implementation"
- Reverse engineering: AI infers the "why" from the "what"

### Phase 3: Enterprise Platform — Month 10+

**The Product:**
- Full web-based "Reasoning Workspace" (think Notion meets GitHub)
- Features: SSO, RBAC, Audit Trails, Jira/Linear bidirectional sync
- Advanced: Drift detection, automated regression testing for specs

**Sales Motion:**
- Top-down: Sell to VP of Product, CIO, Head of Engineering
- Pitch: "Your AI agents are a compliance risk. You have no governance over what they're building. Our platform provides the audit trail."

**Pricing:**
- Platform fee: $10k/year (covers indexing + enterprise security)
- Usage fee: $50 per Executable Spec generated
- Agent compute markup: If we host the orchestrator agent, charge for compute time

**Target Customers:**
- Fortune 500 enterprises deploying AI agents at scale (Mercedes, Uber, Workday per Google's case studies)
- Need: Compliance, governance, auditability

---

## Tech Stack (Recommended)

### Frontend
- **Editor:** Tiptap or ProseMirror (extensible rich text)
- **Framework:** Next.js 14+ (App Router, React Server Components)
- **UI:** Tailwind + Radix UI (accessible, composable)
- **IDE Extension:** VS Code Extension API

### Backend
- **API:** Next.js API routes → Migrate to tRPC or GraphQL for complex needs
- **Auth:** Clerk or Auth0 (SSO, RBAC)
- **Queue:** BullMQ (Redis-based job queue for async processing)

### Data Layer
- **Primary DB:** PostgreSQL (Neon or Supabase for managed + RLS)
- **Vector DB:** Pinecone or Weaviate (semantic search)
- **Graph DB:** Neo4j or Memgraph (relationship reasoning)
- **Cache:** Redis (session, rate limiting)

### AI Infrastructure
- **LLM Router:** Anthropic Claude (Opus for reasoning, Sonnet for volume, Haiku for simple tasks)
- **Embeddings:** OpenAI text-embedding-3-large or Voyage AI
- **Transcription:** Deepgram or AssemblyAI (for customer call ingestion)

### Integrations
- **Unified API:** Unified.to (handles auth + schema for 350+ SaaS tools)
- **Webhooks:** Slack, GitHub, Jira, Linear
- **Storage:** Cloudflare R2 or S3 (for large files, transcripts)

### Infrastructure
- **Hosting:** Fly.io or Railway (low latency, multi-region)
- **CDN:** Cloudflare (global edge, DDoS protection)
- **Observability:** Sentry (errors), PostHog (analytics), Axiom (logs)

---

## Multi-Agent Architecture

### Core Principle
Different roles = different agents with different contexts and constraints.

### Agent Roles

#### 1. **PM Agent (Product Strategist)**
- **Model:** Claude Opus (high reasoning)
- **Context:** Customer feedback, market research, roadmap, business goals
- **Tasks:**
  - Synthesize customer interviews into insights
  - Prioritize features based on impact/effort
  - Write narrative layer of specs
  - Simulate user journeys

#### 2. **Architect Agent (Technical Strategist)**
- **Model:** Claude Opus (system design reasoning)
- **Context:** Codebase, API schemas, tech debt, infrastructure constraints
- **Tasks:**
  - Design system architecture
  - Identify technical constraints
  - Populate constraint layer of specs
  - Review for technical feasibility

#### 3. **Engineer Agent (Implementation)**
- **Model:** Claude Sonnet (balanced speed/quality)
- **Context:** Current branch, file history, style guide, dependencies
- **Tasks:**
  - Implement features from Executable Specs
  - Write unit tests
  - Refactor code
  - Document changes

#### 4. **QA Agent (Quality Assurance)**
- **Model:** Claude Sonnet
- **Context:** Executable Spec (verification layer), test suite, bug reports
- **Tasks:**
  - Generate test cases from Gherkin specs
  - Run simulations (pre-code testing)
  - Verify implementation matches spec
  - Detect edge cases

#### 5. **Ops Agent (Operations/SRE)**
- **Model:** Claude Haiku (fast, deterministic)
- **Context:** Logs, metrics, incidents, runbooks
- **Tasks:**
  - Monitor deployments
  - Trigger rollbacks on anomalies
  - Generate incident reports
  - Update runbooks

#### 6. **Orchestrator Agent (Coordinator)**
- **Model:** Claude Opus (high-level reasoning)
- **Context:** ALL agent outputs, project state, deadlines
- **Tasks:**
  - Assign work to specialized agents
  - Resolve conflicts between agents
  - Maintain "project knowledge base"
  - Report to humans on progress

### Inter-Agent Communication Protocol

**Current State:** OpenClaw doesn't natively support agent-to-agent messaging.

**Workaround (Phase 1):**
- Use `sessions_send` to pass messages between sessions
- Orchestrator Agent polls each agent session for status
- Shared workspace files as "message bus" (e.g., `/tmp/agent-comms/messages.jsonl`)

**Future (Post Feature Request):**
- Native A2A protocol support in OpenClaw
- Agents subscribe to topics (e.g., "spec-approved", "code-review-needed")
- Event-driven handoffs instead of polling

### Example Workflow

```
1. Human: "We need dark mode"
   └─> Orchestrator Agent receives request

2. Orchestrator spawns PM Agent
   └─> PM Agent: 
       - Searches past feedback (RAG)
       - Finds customer requests for dark mode
       - Identifies brand constraint: "Brand Blue cannot invert"
       - Writes narrative layer

3. Orchestrator passes to Architect Agent
   └─> Architect Agent:
       - Scans codebase for theme system
       - Identifies Charts library issue (renders on transparent bg)
       - Writes constraint layer

4. Orchestrator passes to QA Agent
   └─> QA Agent:
       - Writes Gherkin tests
       - Runs pre-code simulation
       - ALERT: "Simulation failed — chart text invisible in dark mode"

5. Orchestrator returns to Architect Agent
   └─> Architect: "Recommendation: Upgrade charts library to v5 OR implement custom background"

6. Orchestrator asks Human for decision

7. Human: "Upgrade library"

8. Orchestrator spawns Engineer Agent
   └─> Engineer:
       - Upgrades charts library
       - Implements dark mode toggle
       - Writes tests

9. QA Agent verifies
   └─> All tests pass

10. Orchestrator deploys via Ops Agent
    └─> Ops: Monitors metrics for 1 hour
    └─> SUCCESS

11. PM Agent updates spec with "Shipped" status
```

---

## Key Decisions & Constraints

### Why Concierge First?
**Thesis:** Building SaaS is easy. Building SaaS people want to pay for is hard.

The Concierge model forces us to:
1. Prove value before building automation
2. Generate cash for bootstrapping
3. Build the gold-standard dataset (our training data)
4. Learn failure modes intimately

**Anti-Pattern:** Spending 6 months building a "perfect MVP" that users hate (per Reddit case studies).

### Why CLI Before Web UI?
**Distribution Advantage:** Engineers use terminals daily. They don't check yet another web dashboard.

Delivering value where they already are (terminal/IDE) creates stickiness. Once engineers are hooked, they pull the rest of the org into the platform.

### Why Hybrid Graph + Vector?
**Vector Search Alone Is Insufficient:**
- Can find "docs about login"
- Cannot find "the Jira ticket that was blocked by the tech debt mentioned in this Slack thread"

**Graph Reasoning Unlocks Causality:**
- "Why is the login broken?"
  → Graph traces: Login depends on Auth Service
  → Auth Service modified by Engineer Dave in PR #405
  → PR #405 broke backward compatibility

This level of reasoning is the moat.

### Why Bet on MCP & A2A?
**Strategic Positioning:** Open protocols create network effects.

- MCP makes us the "default context provider" for Cursor, Windsurf, any IDE
- A2A makes us the "orchestration layer" for coding agents (Devin, Cognition, etc.)

If we win the protocol layer, we win distribution without needing a massive sales team.

---

## Risk Mitigation

### Risk: "Just a wrapper around GPT-5"
**Defense:** The moat is the Context Graph, not the LLM.

A generic model doesn't know:
- Your codebase constraints
- Your brand guidelines
- Your legacy architecture decisions
- The temporal decay of your feedback (2024 feedback < 2026 feedback)

We're building the **data asset** that cannot be replicated without deep integration.

### Risk: "Jira will just build this"
**Defense:** Incumbents are locked in by their own data models.

Jira's entire architecture assumes "ticket = unit of work". Our architecture assumes "spec = living document with dependencies".

Rewriting Jira's core would alienate their existing customer base. They're incentivized to bolt-on AI, not rethink the foundation.

We're the **neutral third party** that can index across Jira + Notion + Slack + GitHub without vendor lock-in.

### Risk: "Enterprises won't trust AI for specs"
**Defense:** Human-in-the-loop by design.

We position as **augmentation**, not automation:
- AI generates the draft
- Human reviews and approves
- Simulator runs pre-code checks
- Human makes final call

Once trust is established (through audit trails showing AI catching errors humans missed), we gradually increase autonomy.

---

## Success Metrics (Phases)

### Phase 1 (Concierge)
- 5 paying customers @ $3k/month = $15k MRR
- 90% retention
- NPS > 50
- Testimonials: "10x'd our velocity"

### Phase 2 (CLI)
- 500 CLI installs
- 50 paid users @ $50/month = $2.5k MRR
- 20% conversion (free → paid)
- 1 viral tweet/week from power users

### Phase 3 (Enterprise)
- 10 enterprise deals @ $50k/year = $500k ARR
- 1 "lighthouse customer" (Fortune 500)
- Case study published in TechCrunch/The Verge
- Inbound leads > 100/month

---

## Open Questions (For AI Assistants to Help Solve)

1. **Agent Communication:** How do we implement agent-to-agent messaging before OpenClaw supports it natively?
2. **Temporal Decay:** What's the right decay function for context relevance? Linear, exponential, or step-function?
3. **Simulation Fidelity:** How do we make Virtual User testing accurate without being a full-blown integration test suite?
4. **Privacy:** How do we ingest Slack/Notion without violating GDPR/SOC2 requirements?
5. **Pricing:** Should we charge per-spec or per-agent-hour? What's the unit economics?

---

## How to Contribute (AI Assistant Guidelines)

### When Working on This Project:

1. **Read This File First:** Ensure you have the full context
2. **Check Memory:** Read `~/reasoning-engine/memory/YYYY-MM-DD.md` for recent decisions
3. **Document Decisions:** Update `/docs/decisions/` with ADRs (Architecture Decision Records)
4. **Think in Systems:** This is not a CRUD app. Every feature is a node in a graph with dependencies.
5. **Prototype Fast:** Concierge model means we test ideas with customers BEFORE coding them

### Code Style:
- **TypeScript:** Strict mode, no `any`
- **Functions:** Pure where possible, side effects isolated
- **Comments:** Explain "why", not "what"
- **Tests:** Write tests for logic, not just for coverage

### Communication:
- **Be Direct:** No corporate-speak. Say "This won't work because X" instead of "Interesting idea, but..."
- **Show, Don't Tell:** Prototype > explanation
- **Challenge Assumptions:** If something doesn't make sense, speak up

---

## Resources & References

### Key Articles
- [YC RFS Spring 2026](https://www.ycombinator.com/rfs) — Original request for "Cursor for PM"
- [Google Cloud: 101 Real-World Gen AI Use Cases](https://cloud.google.com/transform/101-real-world-generative-ai-use-cases-from-industry-leaders)
- [What is Vibe Coding?](https://cloud.google.com/discover/what-is-vibe-coding)

### Protocols
- [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) — Anthropic's context standard
- [Agent2Agent Protocol (A2A)](https://developers.googleblog.com/en/a2a-a-new-era-of-agent-interoperability/) — Google's agent coordination protocol

### Tools
- [Unified.to](https://unified.to/) — Universal API for SaaS integrations
- [Cursor](https://www.cursor.com/) — AI-first code editor (our "spiritual sibling")

### Philosophies
- [Concierge MVP Methodology](https://blog.logrocket.com/product-management/concierge-wizard-of-oz-mvp/)
- [Behavior-Driven Development (BDD)](https://www.functionize.com/automated-testing/behavior-driven-development) — Gherkin syntax for specs

---

## Current Status (Updated: 2026-02-09)

- **Stage:** Conceptual design → Setting up project structure
- **Team:** Shreyansh (founder) + AI agents (Goody the assistant)
- **Next Steps:**
  1. Set up multi-agent architecture in OpenClaw
  2. Create comprehensive architecture docs
  3. File feature request for agent-to-agent communication
  4. Identify first concierge customer (YC founder)

---

*This file is living documentation. Update it as the project evolves. When in doubt, over-communicate context.*
