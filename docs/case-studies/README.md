# Case Studies for The Reasoning Engine

This directory contains compelling case studies demonstrating how The Reasoning Engine prevents disasters through context intelligence and pre-code simulation.

## Available Case Studies

### 02: The Bulk Delete Disaster ⭐ PRIMARY DEMO

**Scenario:** A "simple" bulk delete feature accidentally bypasses permission checks, causing $220K in damage—prevented by pre-code simulation.

**Files:**
- **`02-public-case-study.md`** - Full detailed case study (19KB, comprehensive)
- **`02-pitch-deck-summary.md`** - Concise version for pitch deck slides
- **`02-demo-guide.md`** - Live demo walkthrough instructions
- **`../simulations/bulk-delete-demo.sh`** - Interactive terminal demo script

**Key Metrics:**
- Prevention cost: $5K (3 extra dev days)
- Incident cost avoided: $220K (churn + emergency fix + restoration)
- ROI: 4,400%

**Use Cases:**
- Incubator/accelerator applications (YC, etc.)
- Investor pitch decks
- Product demos for technical founders
- Sales presentations for enterprise customers

---

## How to Use These Case Studies

### For Pitch Decks
Use `02-pitch-deck-summary.md` - it has:
- One-liner version
- Two-sentence version
- Visual diagrams for slides
- Key metrics table

### For Live Demos
1. Read `02-demo-guide.md` for full demo flow
2. Run `../simulations/bulk-delete-demo.sh` for interactive terminal demo
3. Time: 8-10 minutes including Q&A

### For Deep Dives
Use `02-public-case-study.md` - comprehensive breakdown including:
- Full simulated Slack/GitHub/Zendesk context
- Code comparisons (buggy vs correct)
- Complete Executable Spec example
- Simulation output showing caught bugs
- Real-world parallels (GitHub, Slack, Salesforce incidents)

---

## Case Study Selection Guide

**Audience: Technical Founders**
→ Use full case study, emphasize code comparison

**Audience: Non-Technical Founders**  
→ Use pitch deck summary, focus on Slack conversation and timeline

**Audience: Enterprise Buyers**
→ Emphasize compliance angle (SOC2 violation prevented)

**Audience: Investors**
→ Lead with ROI: 4,400% return on preventing one bug

---

## Running the Interactive Demo

```bash
# Make sure the script is executable
chmod +x ../simulations/bulk-delete-demo.sh

# Run the demo
../simulations/bulk-delete-demo.sh
```

The demo script will:
1. Show context ingestion from multiple sources (Slack, Zendesk, GitHub)
2. Generate the Executable Spec in real-time
3. Run pre-code simulation
4. Display the critical security failure it caught
5. Show root cause analysis and recommended fix
6. Calculate ROI (prevention vs incident cost)

**Duration:** ~3-4 minutes (with pauses for dramatic effect)

---

## Future Case Studies (Planned)

### 03: The Notification Storm
How a "simple" notification feature caused 10M+ emails and $50K in SendGrid bills

### 04: The Data Migration Surprise  
How hidden foreign key constraints broke a "routine" database migration

### 05: The OAuth Redirect Loop
How a login improvement locked out 30% of mobile users

---

## Contributing New Case Studies

New case studies should include:
1. **Full version** - Comprehensive breakdown with all context
2. **Summary version** - 1-2 sentences for pitch use
3. **Demo guide** - How to present live
4. **Simulation script** (optional) - Interactive terminal demo

Template: Use `02-public-case-study.md` as template structure.

---

## Questions?

See `CLAUDE.md` in the root directory for full project context.

**Last Updated:** 2026-02-09  
**Maintained By:** PM Agent (The Reasoning Engine)
