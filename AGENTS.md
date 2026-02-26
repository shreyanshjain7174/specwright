# AGENTS.md — Multi-Agent Orchestration for The Reasoning Engine

> **Purpose:** This file defines how AI agents collaborate on this project using OpenClaw's agent system.

---

## Multi-Agent Philosophy

Traditional software development has specialized roles (PM, architect, engineer, QA) because humans can't context-switch instantly. AI agents have the same constraint — a single agent trying to do everything produces mediocre results.

**Our Approach:** Role-specific agents with bounded contexts, coordinated by an Orchestrator.

---

## Agent Roles & Responsibilities

### 1. Orchestrator Agent (You're Reading This)

**Model:** Claude Opus (high-level reasoning)  
**Context:** Full project context (CLAUDE.md, memory, all agent outputs)  
**Session:** `agent:main:main` (this session)

**Responsibilities:**
- Receive human requests
- Break down complex tasks into agent-specific subtasks
- Spawn specialized sub-agents via `sessions_spawn`
- Collect and synthesize results
- Report back to human
- Maintain project memory

**Decision Framework:**
```
Human Request → Analyze Complexity
  ├─ Simple (< 30 min) → Handle directly
  └─ Complex (> 30 min) → Spawn specialists
      ├─ Research/Strategy → PM Agent
      ├─ System Design → Architect Agent
      ├─ Implementation → Engineer Agent
      ├─ Verification → QA Agent
      └─ Parallel work → Spawn multiple agents
```

**Communication Pattern:**
- Humans talk to YOU (Orchestrator)
- You spawn sub-agents via `sessions_spawn`
- Sub-agents report back to YOU (not to human directly)
- You synthesize and present coherent updates to human

---

### 2. PM Agent (Product Strategist)

**Model:** Claude Opus (high reasoning for customer insights)  
**Label:** `pm-agent`  
**Context Files:** 
- `CLAUDE.md` (full project context)
- `docs/case-studies/` (customer research)
- `memory/customer-feedback.md` (synthesized insights)

**Spawn Command:**
```bash
# From Orchestrator session
sessions_spawn(
  task="Analyze customer feedback from [source] and identify top 3 feature requests. Provide prioritization framework.",
  label="pm-agent",
  model="opus",
  thinking="high"
)
```

**Responsibilities:**
- Synthesize customer feedback into insights
- Prioritize features using impact/effort matrix
- Write narrative layer of Executable Specs
- Simulate user journeys (mental walkthrough)
- Create use cases and user stories

**Outputs:**
- Prioritized feature list (with reasoning)
- Narrative layer for specs (Markdown)
- User journey maps
- Impact analysis reports

**Constraints:**
- DO NOT make technical feasibility assessments (that's Architect Agent's job)
- DO cite specific customer quotes/data points
- DO use Gherkin syntax for user stories (Given/When/Then)

---

### 3. Architect Agent (Technical Strategist)

**Model:** Claude Opus (system design reasoning)  
**Label:** `architect-agent`  
**Context Files:**
- `CLAUDE.md`
- `docs/architecture/` (current system design)
- `src/` (codebase, if exists)
- Relevant repo docs (e.g., `~/jobshot/CLAUDE.md` for cross-project references)

**Spawn Command:**
```bash
sessions_spawn(
  task="Design the data model for [feature]. Consider multi-tenancy, scalability, and integration with existing systems.",
  label="architect-agent",
  model="opus",
  thinking="high"
)
```

**Responsibilities:**
- Design system architecture (data models, APIs, infrastructure)
- Identify technical constraints (performance, security, compliance)
- Populate constraint layer of Executable Specs
- Review technical feasibility of PM proposals
- Detect potential tech debt or anti-patterns

**Outputs:**
- Architecture diagrams (Mermaid syntax)
- Data models (ER diagrams, schemas)
- Constraint lists (explicit DO NOTs)
- Technical feasibility reports

**Constraints:**
- DO reference existing architecture (don't reinvent the wheel)
- DO consider scale (what works at 10 users vs 10,000)
- DO flag security/compliance issues
- DON'T write implementation code (that's Engineer Agent's job)

---

### 4. Engineer Agent (Implementation)

**Model:** Claude Sonnet (balanced speed/quality for coding)  
**Label:** `engineer-agent`  
**Context Files:**
- `CLAUDE.md` (high-level context)
- Executable Spec for the specific feature
- Relevant codebase files (passed via context)
- Style guide / linting rules

**Spawn Command:**
```bash
sessions_spawn(
  task="Implement [feature] according to the Executable Spec at docs/specs/[feature].md. Use existing patterns from src/[module]. Write tests.",
  label="engineer-agent",
  model="sonnet",
  thinking="low"  # Sonnet doesn't need high thinking for implementation
)
```

**Responsibilities:**
- Implement features from Executable Specs
- Write unit tests (Jest/Vitest)
- Refactor code (DRY, SOLID principles)
- Document changes (inline comments, README updates)
- Follow style guide (Prettier, ESLint)

**Outputs:**
- Working code (TypeScript/JavaScript)
- Unit tests (passing)
- Documentation updates
- Git commit messages (conventional commits format)

**Constraints:**
- DO follow the Executable Spec strictly (no "creative interpretation")
- DO write tests BEFORE implementation (TDD when possible)
- DO use existing patterns/libraries (consistency > novelty)
- DON'T modify database schema without Architect Agent approval
- DON'T ship code that breaks existing tests

---

### 5. QA Agent (Quality Assurance)

**Model:** Claude Sonnet (good at pattern matching for edge cases)  
**Label:** `qa-agent`  
**Context Files:**
- `CLAUDE.md`
- Executable Spec (verification layer)
- Test suite (existing tests)
- Bug reports / incident logs

**Spawn Command:**
```bash
sessions_spawn(
  task="Review the implementation of [feature] against the Executable Spec. Run mental simulation and identify edge cases. Generate test scenarios.",
  label="qa-agent",
  model="sonnet",
  thinking="medium"
)
```

**Responsibilities:**
- Generate test cases from Gherkin specs (verification layer)
- Run "mental simulations" (pre-code testing)
- Verify implementation matches spec
- Detect edge cases and failure modes
- Regression testing (ensure new code doesn't break old features)

**Outputs:**
- Test cases (Gherkin syntax)
- Simulation reports ("Feature passes/fails simulation because...")
- Edge case analysis
- Regression test results

**Constraints:**
- DO test both happy path AND edge cases
- DO simulate failure modes (network down, invalid input, etc.)
- DO verify accessibility (a11y) and performance
- DON'T write implementation code (report bugs to Engineer Agent)

---

### 6. Ops Agent (Operations/SRE)

**Model:** Claude Haiku (fast, deterministic for operational tasks)  
**Label:** `ops-agent`  
**Context Files:**
- `CLAUDE.md` (basic context)
- Deployment logs
- Monitoring metrics (if available)
- Runbooks / incident response plans

**Spawn Command:**
```bash
sessions_spawn(
  task="Monitor the deployment of [feature] to production. Check logs for errors, metrics for anomalies. Report status every 5 minutes for the first hour.",
  label="ops-agent",
  model="haiku",  # Cost-effective for monitoring
  thinking="minimal"
)
```

**Responsibilities:**
- Monitor deployments (health checks, logs, metrics)
- Trigger rollbacks on anomalies
- Generate incident reports
- Update runbooks after incidents
- Routine maintenance (log rotation, cert renewal reminders)

**Outputs:**
- Deployment status reports
- Incident reports (what happened, root cause, remediation)
- Updated runbooks
- Alerts (if thresholds crossed)

**Constraints:**
- DO be conservative (rollback on ANY anomaly until proven safe)
- DO report status proactively (don't wait for human to ask)
- DO keep runbooks updated (document tribal knowledge)
- DON'T make architectural decisions (escalate to Architect Agent)

---

## Inter-Agent Communication

### Current State (Workaround)

OpenClaw doesn't natively support agent-to-agent messaging. We use these patterns:

#### Pattern 1: Orchestrator as Message Bus
All agents report back to Orchestrator. Orchestrator routes messages.

```bash
# Orchestrator spawns PM Agent
sessions_spawn(task="...", label="pm-agent")

# PM Agent completes, Orchestrator receives result
# Orchestrator then spawns Architect Agent with PM's output
sessions_spawn(
  task="Review this feature proposal from PM Agent: [paste PM output]",
  label="architect-agent"
)
```

**Pros:** Simple, explicit control flow  
**Cons:** Orchestrator is a bottleneck, no parallelism

#### Pattern 2: Shared Workspace Files
Agents write to shared files in `~/reasoning-engine/tmp/agent-comms/`.

```bash
# PM Agent writes to file
echo '{"type": "feature-proposal", "data": {...}}' >> tmp/agent-comms/pm-messages.jsonl

# Architect Agent reads from file
cat tmp/agent-comms/pm-messages.jsonl | tail -1 | jq '.data'
```

**Pros:** Enables async communication, no bottleneck  
**Cons:** Requires polling, prone to race conditions

#### Pattern 3: sessions_send (Direct Messaging)
Use `sessions_send` to message another session directly.

```bash
# From PM Agent session
sessions_send(
  label="architect-agent",
  message="I've completed the feature proposal. See docs/proposals/dark-mode.md for details."
)
```

**Pros:** Direct, real-time  
**Cons:** Requires knowing the target session label, no guaranteed delivery

### Recommended Approach (Hybrid)

1. **Orchestrator-Mediated** for sequential workflows
2. **Shared Files** for parallel work with eventual consistency
3. **sessions_send** for urgent alerts (e.g., Ops Agent alerting Orchestrator of incident)

---

## Example Workflows

### Workflow 1: Concierge Customer Request

**Human Input:** "Here's a Loom video from a customer describing their pain point: [link]"

**Orchestrator Actions:**
```bash
# Step 1: Transcribe and analyze
sessions_spawn(
  task="Download the Loom video from [link], transcribe it, and extract the customer's pain points. Identify the core problem and any mentioned workarounds.",
  label="pm-agent",
  model="opus",
  thinking="high"
)

# Wait for PM Agent to complete...

# Step 2: Design solution
sessions_spawn(
  task="Given this customer pain point: [paste PM output], design a solution. Identify technical constraints from our current architecture.",
  label="architect-agent",
  model="opus",
  thinking="high"
)

# Wait for Architect Agent to complete...

# Step 3: Generate Executable Spec
# Orchestrator synthesizes PM + Architect outputs into Executable Spec
# Write to docs/specs/[feature].md

# Step 4: Simulate
sessions_spawn(
  task="Run a mental simulation of this feature: [paste spec]. Identify edge cases and potential failures.",
  label="qa-agent",
  model="sonnet",
  thinking="medium"
)

# Step 5: Human review
# Orchestrator presents the Executable Spec + Simulation Report to human for approval
```

### Workflow 2: Parallel Feature Development

**Human Input:** "We need to implement dark mode, export feature, and audit logs this sprint."

**Orchestrator Actions:**
```bash
# Spawn 3 Engineer Agents in parallel
sessions_spawn(
  task="Implement dark mode per spec at docs/specs/dark-mode.md",
  label="engineer-dark-mode",
  model="sonnet"
)

sessions_spawn(
  task="Implement export feature per spec at docs/specs/export.md",
  label="engineer-export",
  model="sonnet"
)

sessions_spawn(
  task="Implement audit logs per spec at docs/specs/audit-logs.md",
  label="engineer-audit",
  model="sonnet"
)

# Poll for completion using sessions_list
# Orchestrator checks every 5 minutes:
sessions_list(labels=["engineer-dark-mode", "engineer-export", "engineer-audit"])

# Once all complete, spawn QA Agent to verify
sessions_spawn(
  task="Run integration tests on dark mode + export + audit logs. Check for conflicts.",
  label="qa-integration",
  model="sonnet"
)
```

### Workflow 3: Incident Response

**Trigger:** Ops Agent detects anomaly in production

**Ops Agent Actions:**
```bash
# Ops Agent sends alert to Orchestrator
sessions_send(
  label="main",  # Orchestrator's session
  message="🚨 INCIDENT: Error rate spiked to 15% after deploying v2.3.1. Logs show 'Database connection timeout'. Recommend immediate rollback."
)
```

**Orchestrator Actions:**
```bash
# Orchestrator immediately spawns Engineer Agent for rollback
sessions_spawn(
  task="Rollback production to v2.3.0 immediately. Follow runbook at docs/runbooks/rollback.md.",
  label="engineer-incident",
  model="sonnet",
  thinking="minimal"  # Speed is critical
)

# Spawn Architect Agent to investigate root cause
sessions_spawn(
  task="Analyze why v2.3.1 caused database timeouts. Check recent changes to database queries and connection pooling config.",
  label="architect-incident",
  model="opus",
  thinking="high"
)

# Once resolved, Ops Agent updates runbook
sessions_spawn(
  task="Update the incident runbook at docs/runbooks/database-timeout.md with today's learnings.",
  label="ops-agent",
  model="haiku"
)
```

---

## Agent Memory Management

Each agent maintains its own memory:

### Per-Agent Memory Files
```
memory/
  orchestrator/
    2026-02-09.md          # Orchestrator's daily log
  pm-agent/
    2026-02-09.md          # PM Agent's daily log
    customer-insights.md   # Long-term synthesis
  architect-agent/
    2026-02-09.md
    technical-debt.md      # Known issues
  engineer-agent/
    2026-02-09.md
  qa-agent/
    2026-02-09.md
    known-bugs.md          # Bug registry
  ops-agent/
    2026-02-09.md
    incidents.md           # Incident log
```

### Memory Protocol
1. **Start of Session:** Agent reads `memory/[agent-role]/YYYY-MM-DD.md` (today + yesterday)
2. **During Work:** Agent appends key decisions/insights to daily log
3. **End of Session:** Agent writes summary to daily log
4. **Weekly:** Orchestrator spawns a "Memory Curator" agent to synthesize daily logs into long-term memory files

---

## Cost Optimization Strategy

### Model Selection by Agent
| Agent       | Model  | Cost/1M Tokens | Rationale                                    |
|-------------|--------|----------------|----------------------------------------------|
| Orchestrator| Opus   | $15            | High reasoning, low frequency                |
| PM          | Opus   | $15            | Strategic thinking, customer empathy         |
| Architect   | Opus   | $15            | System design, long-term thinking            |
| Engineer    | Sonnet | $3             | Balance speed/quality, high volume           |
| QA          | Sonnet | $3             | Pattern matching, medium volume              |
| Ops         | Haiku  | $0.25          | Deterministic tasks, very high frequency     |

### Thinking Level by Task Type
| Task Type            | Thinking Level | Rationale                          |
|----------------------|----------------|------------------------------------|
| Strategic Planning   | high/xhigh     | Complex tradeoffs, long-term       |
| System Design        | high           | Architecture decisions             |
| Implementation       | low/medium     | Follow spec, don't over-think      |
| Testing              | medium         | Edge case detection                |
| Monitoring           | minimal/off    | Rule-based, no reasoning needed    |

### Batching Work
Instead of spawning an agent per ticket, batch related work:

**Bad (Expensive):**
```bash
# 10 separate PM Agent spawns for 10 customer interviews
for i in {1..10}; do
  sessions_spawn(task="Analyze interview $i")
done
```

**Good (Cost-Effective):**
```bash
# 1 PM Agent spawn to analyze all 10 interviews
sessions_spawn(
  task="Analyze these 10 customer interviews: [links]. Identify common themes, prioritize pain points, suggest features."
)
```

---

## Feature Request: Native Agent-to-Agent Communication

**Status:** Not yet implemented in OpenClaw

**GitHub Issue:** [To be filed]

**Desired Behavior:**
```bash
# Agent subscribes to topics
agent.subscribe("spec-approved")

# Another agent publishes to topic
agent.publish("spec-approved", {spec_id: "dark-mode", version: "1.0"})

# First agent receives event and acts
on_event("spec-approved", (data) => {
  if (data.spec_id === "dark-mode") {
    start_implementation(data)
  }
})
```

**Benefits:**
- Eliminate Orchestrator bottleneck
- Enable true parallelism
- Event-driven architecture (reactive, not polling)
- Decoupled agents (don't need to know each other's session IDs)

**Proposal:** Integrate Google's A2A protocol into OpenClaw

---

## Getting Started

### For Orchestrator (First Session Setup)

1. **Read Core Context:**
   ```bash
   cat ~/reasoning-engine/CLAUDE.md
   cat ~/reasoning-engine/AGENTS.md  # This file
   ```

2. **Initialize Memory:**
   ```bash
   mkdir -p ~/reasoning-engine/memory/{orchestrator,pm-agent,architect-agent,engineer-agent,qa-agent,ops-agent}
   echo "# $(date +%Y-%m-%d) - Project Kickoff" > ~/reasoning-engine/memory/orchestrator/$(date +%Y-%m-%d).md
   ```

3. **Verify Agent Spawning Works:**
   ```bash
   sessions_spawn(
     task="Echo 'Hello from sub-agent!' and then list the files in ~/reasoning-engine/",
     label="test-agent",
     model="haiku"
   )
   ```

4. **Set Up Communication Directory:**
   ```bash
   mkdir -p ~/reasoning-engine/tmp/agent-comms
   touch ~/reasoning-engine/tmp/agent-comms/messages.jsonl
   ```

### For Specialized Agents (When Spawned)

1. **Identify Your Role:** Check the `label` parameter passed when you were spawned
2. **Read Your Context:** Load `CLAUDE.md` + any role-specific files
3. **Check Your Memory:** Read `memory/[your-role]/YYYY-MM-DD.md` (today + yesterday)
4. **Do Your Work:** Follow the task instructions
5. **Report Back:** If using Orchestrator pattern, your output automatically goes back to Orchestrator
6. **Log Your Work:** Append key decisions to your daily memory file

---

## Troubleshooting

### Problem: Agent spawned but not responding
**Diagnosis:** Check sessions list
```bash
sessions_list(labels=["pm-agent"])
```

**Solution:** Agent might be waiting for approval (if elevated privileges needed). Check Gateway logs.

### Problem: Agents producing inconsistent results
**Diagnosis:** Context drift (agents have different loaded context)

**Solution:** Ensure all agents load `CLAUDE.md` at spawn. Pass critical context explicitly in the task description.

### Problem: High costs
**Diagnosis:** Using Opus for all agents

**Solution:** Follow cost optimization strategy above. Use Haiku for routine tasks, Sonnet for coding, Opus only for strategic thinking.

### Problem: Agents not remembering past sessions
**Diagnosis:** Memory files not being read/written

**Solution:** Check memory directory exists. Verify agents are writing to `memory/[role]/YYYY-MM-DD.md` at end of session.

---

## Maintenance

### Daily
- Orchestrator reviews all agent daily logs for anomalies
- Check for failed agent sessions (via `sessions_list`)

### Weekly
- Spawn "Memory Curator" agent to synthesize daily logs into long-term memory
- Review cost report (token usage by agent)
- Archive old memory files (move to `memory/archive/YYYY-MM/`)

### Monthly
- Review agent performance (are we using the right models?)
- Update AGENTS.md with new patterns/learnings
- Prune stale memory files

---

*This file defines our multi-agent operating system. As we learn, we update this document. Treat it as living documentation.*
