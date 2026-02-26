# ADR-001: Skip Concierge, Build Demo MVP

**Date:** 2026-02-09  
**Status:** Accepted  
**Deciders:** Shreyansh

## Context

Original GTM strategy was Concierge MVP → CLI → Enterprise Platform.

**Problem with Concierge:**
- Requires customers to share everything (Slack, codebase, customer data)
- Trust barrier is too high for pre-traction startup
- Time to first customer could be months

**Opportunity:**
- Incubator application deadline approaching
- Need a working demo, not a service offering
- Can use public case studies / synthetic data for demo

## Decision

Skip Phase 1 (Concierge) and go directly to Phase 2 (Application).

Build a web-based demo MVP that:
1. Accepts pasted context (Slack messages, customer feedback, etc.)
2. Generates Executable Specifications
3. Runs pre-code simulation
4. Exports spec for AI coding tools (Cursor, Claude, etc.)

## Consequences

**Positive:**
- Faster time to demo
- Tangible product for incubator pitch
- Can iterate on UX without customer dependency

**Negative:**
- No revenue validation (will need to prove value post-funding)
- Using synthetic/public data means less "real-world" testing
- May build features nobody wants

**Mitigations:**
- Use realistic public case studies (GitHub issues, HN discussions)
- Get feedback from founders in incubator cohort
- Keep MVP scope tight (spec generation + simulation only)

## Technical Implications

- Need web UI (Next.js)
- Need LLM integration (Claude API)
- Skip complex integrations (Slack, Jira) for now — use paste interface
- Focus on core value: Context → Spec → Simulation
