# Case Study: Dark Mode Hallucination Prevented

**Date:** 2026-02-09  
**Scenario:** Hypothetical (Pre-MVP)  
**Outcome:** $5,000 engineering time saved

---

## Background

**Company:** Acme SaaS (early-stage B2B analytics platform, 3-person team)  
**Customer:** Enterprise user complained in support ticket: *"I work late nights. Your bright white dashboard hurts my eyes."*

**Traditional Flow (Without Reasoning Engine):**

```
1. Support → Zendesk ticket created
2. PM sees ticket → Adds to Jira: "Implement dark mode"
3. Engineer picks up ticket (vague: "Add dark mode")
4. Engineer uses AI coding agent (Cursor):
   - Prompt: "Add dark mode toggle to the app"
   - Agent generates CSS that inverts all colors
5. Engineer tests locally → Looks good!
6. Ships to production
7. **PROBLEM DISCOVERED:**
   - Brand Blue (#0066CC) is now inverted (breaks brand guidelines)
   - Chart library renders text on transparent background → invisible in dark mode
   - Enterprise customer complains: "This is worse than before"
8. Emergency hotfix required
   - Roll back feature
   - Architect investigates (discovers Charts library limitation)
   - Engineer spends 2 days implementing proper dark mode
   - QA re-tests
   - Re-deploy
```

**Time Wasted:** 2.5 days (20 hours) x $150/hour (senior engineer) = **$3,000**  
**Opportunity Cost:** Feature delayed by 1 week, customer frustrated

---

## With Reasoning Engine

**Flow:**

### Step 1: PM Receives Feedback
```
Support ticket: "Bright dashboard hurts eyes at night"
PM: "This is a common pain point. Let's add dark mode."
```

### Step 2: PM Uses Reasoning Engine (Concierge Service)
PM sends a 5-minute Loom video to Reasoning Engine:
> "Hey, we've been getting feedback about the bright UI. Can you spec out a dark mode feature? I think it's straightforward—just invert colors. But check if there are any gotchas."

### Step 3: Reasoning Engine Generates Executable Spec

**Process (behind the scenes):**

1. **RAG Search:**
   - Searches Zendesk: Finds 3 similar customer complaints
   - Searches Slack: PM mentioned "Chart library has issues with themes" 2 months ago
   - Searches GitHub: Finds `brand_guidelines.md` (constraint: Brand Blue unchangeable)
   - Searches Docs: Finds Charts library v4 documentation (known issue: transparent backgrounds)

2. **Constraint Extraction:**
   - Brand Blue must remain #0066CC (critical)
   - WCAG AA contrast ratio >= 4.5:1 (compliance)
   - Charts library v4 has transparent background bug (technical debt)

3. **Spec Generation:**

```yaml
spec_id: "dark-mode"
version: "1.0"
status: "draft"

narrative:
  title: "Dark Mode Support"
  objective: "Reduce eye strain for users working late nights"
  rationale: "3 customer complaints in last 30 days (Zendesk tickets #401, #423, #445)"

context_pointers:
  - source: "zendesk://ticket/401"
    timestamp: "2026-01-15T10:00:00Z"
    excerpt: "I work nights, bright screens hurt my eyes"
  
  - source: "slack://C1234567890/p1234567890123456"
    timestamp: "2025-12-10T15:30:00Z"
    excerpt: "Heads up: Chart library has weird issues with dark themes"
  
  - source: "github://acme/app/blob/main/docs/brand_guidelines.md#colors"
    section: "Brand Colors"
    rule: "Brand Blue (#0066CC) must never be modified"
  
  - source: "github://chartjs/docs/known-issues.md#transparent-backgrounds"
    issue: "v4 renders text on transparent backgrounds (invisible in dark mode)"
    fix: "Upgrade to v5 OR set explicit background colors"

constraints:
  - id: "C1"
    rule: "DO NOT invert Brand Blue (#0066CC)"
    source: "brand_guidelines.md"
    severity: "critical"
  
  - id: "C2"
    rule: "Ensure all text contrast ratios >= 4.5:1 (WCAG AA)"
    source: "accessibility_standards.md"
    severity: "critical"
  
  - id: "C3"
    rule: "Charts library v4 has transparent bg issue. MUST upgrade to v5 OR set explicit background"
    source: "charts_docs.md"
    severity: "warning"
  
  - id: "C4"
    rule: "DO NOT ship without testing in dark mode on all major pages (Dashboard, Reports, Settings)"
    severity: "warning"

verification:
  - scenario: "User toggles dark mode on"
    given: "User is logged in and viewing Dashboard"
    when: "User clicks 'Dark Mode' toggle in Settings"
    then:
      - "All text is readable (contrast check passes)"
      - "Brand Blue (#0066CC) remains unchanged"
      - "Charts render correctly (no invisible text)"
      - "Toggle state persists across sessions"
  
  - scenario: "User toggles dark mode off"
    given: "User has dark mode enabled"
    when: "User clicks 'Dark Mode' toggle to disable"
    then:
      - "UI returns to light theme"
      - "All elements render correctly"

simulation:
  status: "FAILED"
  failures:
    - scenario: "User toggles dark mode on"
      step: "Then charts render correctly"
      failure: "Ambiguity detected: Spec does not specify what happens if user is viewing a chart at the moment they toggle. Does the chart re-render immediately or on next page load?"
    
    - scenario: "Charts library constraint"
      failure: "Constraint C3 requires upgrading Charts library to v5. This is a dependency change (package.json) that may introduce breaking changes. Recommend: verify no other features use Charts v4-specific APIs."
  
  suggestions:
    - "Add constraint: Charts must re-render within 2 seconds of toggle"
    - "Add test scenario: Chart interactions (hover, tooltips) work correctly in both themes"
    - "Add rollout plan: Dark mode released to beta users first (10% rollout)"
```

### Step 4: PM Reviews Spec

**PM's Reaction:**
> "Whoa, I had NO IDEA about the Charts library issue. This would've been a disaster. Let me check with the engineer about upgrading to v5."

**PM talks to Engineer:**
- Engineer: "v5 is a major upgrade. Breaking changes in the API. Will take 3 hours to migrate."
- PM: "Okay, let's do that BEFORE we implement dark mode."

**PM Updates Spec:**
- Adds dependency task: "Upgrade Charts library to v5" (separate ticket)
- Updates dark mode spec: "DO NOT start until Charts upgrade is complete"

### Step 5: Engineer Implements (Using Executable Spec)

**Engineer uses Cursor with MCP integration:**

```bash
# In Cursor IDE terminal
@spec:dark-mode implement this feature

# Cursor fetches the Executable Spec from Reasoning Engine via MCP
# Context window now includes:
# - Full spec (narrative, context, constraints, tests)
# - Brand guidelines
# - Charts library upgrade notes
```

**AI Coding Agent (Cursor) generates code:**
- Implements dark mode toggle (React state + localStorage persistence)
- Applies CSS variables for theme switching
- **Respects constraints:**
  - Brand Blue remains #0066CC (explicit CSS override)
  - Charts library v5 API used (with explicit backgrounds)
  - Contrast ratios checked (automated a11y tool)

**Engineer writes tests (from Gherkin specs):**
```typescript
describe('Dark Mode', () => {
  it('preserves Brand Blue color', () => {
    toggleDarkMode();
    const brandElement = screen.getByTestId('brand-logo');
    expect(getComputedStyle(brandElement).color).toBe('rgb(0, 102, 204)');  // #0066CC
  });

  it('renders charts correctly', () => {
    toggleDarkMode();
    const chart = screen.getByTestId('analytics-chart');
    expect(chart).toHaveStyle({ backgroundColor: 'var(--chart-dark-bg)' });
    // Verify text is visible (contrast check)
  });
});
```

### Step 6: QA Verification

**QA Agent (AI) runs simulation:**
- All test scenarios pass
- No regressions detected
- Charts render correctly in both themes

**Human QA spot-checks:**
- Manually tests on Dashboard, Reports, Settings
- Confirms: Brand Blue unchanged, charts visible, text readable

### Step 7: Ship to Production

**Result:**
- Feature shipped in **1 day** (vs 1 week in traditional flow)
- **Zero** production incidents
- Customer feedback: "This is exactly what I needed!"

---

## Cost-Benefit Analysis

### Traditional Flow (Without Reasoning Engine)
| Phase                | Time     | Cost       |
|----------------------|----------|------------|
| Initial implementation (broken) | 4 hours  | $600       |
| QA testing (discovered bug)     | 2 hours  | $200       |
| Rollback                        | 1 hour   | $150       |
| Investigation (Charts issue)    | 3 hours  | $450       |
| Re-implementation (proper fix)  | 8 hours  | $1,200     |
| Re-testing                      | 2 hours  | $200       |
| **Total**                       | **20h**  | **$2,800** |
| **Opportunity cost** (1 week delay) |      | **$2,000** |
| **TOTAL COST**                  |          | **$4,800** |

### With Reasoning Engine
| Phase                | Time     | Cost       |
|----------------------|----------|------------|
| PM submits Loom video           | 5 min    | $10        |
| Reasoning Engine generates spec | Auto     | $2 (LLM)   |
| PM reviews spec                 | 15 min   | $20        |
| PM approves spec                | 5 min    | $10        |
| Engineer implements (with spec) | 4 hours  | $600       |
| QA testing (passes first time)  | 1 hour   | $100       |
| **Total**                       | **5.5h** | **$742**   |
| **Reasoning Engine service fee**|          | **$250**   |
| **TOTAL COST**                  |          | **$992**   |

**Savings:** $4,800 - $992 = **$3,808**  
**Time Savings:** 20h - 5.5h = **14.5 hours**  
**ROI:** 384% (for a single feature)

---

## Key Learnings

### What Reasoning Engine Caught

1. **Brand Constraint:** Prevented brand guideline violation
2. **Technical Debt:** Surfaced Charts library limitation (tribal knowledge from Slack)
3. **Dependency Order:** Identified that Charts upgrade must happen FIRST
4. **Test Coverage:** Generated comprehensive test scenarios (including edge cases)

### What Would've Been Missed

Without Reasoning Engine:
- Engineer wouldn't have known about Brand Blue constraint (doc buried in repo)
- Charts issue wouldn't be discovered until production
- No systematic test scenarios (engineer would've done "manual smoke test")
- PM wouldn't have historical context (3 previous customer complaints)

---

## Conclusion

**Value Proposition Validated:**

For a **$250 concierge service fee**, Acme SaaS saved:
- $3,800 in engineering time
- 1 week of delay (opportunity cost)
- Customer frustration (brand damage avoided)
- Emergency hotfix stress

**Testimonial (Hypothetical):**
> "The Reasoning Engine is like having a senior architect who remembers everything. It caught a Charts library bug that would've been a nightmare in production. Worth every penny."  
> — PM at Acme SaaS

---

## Implications for Scaling

**If Acme SaaS ships 10 features per month:**
- Without Reasoning Engine: 1-2 features have "hallucination" issues → $10k/month wasted
- With Reasoning Engine: $2,500/month service fee → $7,500/month SAVED

**At scale (100 features/year):**
- Traditional cost: $50,000 in preventable errors
- Reasoning Engine cost: $30,000 (service fees)
- **Net savings: $20,000/year**

Plus: Faster velocity, happier customers, less stressed engineers.

---

*This case study demonstrates the core value proposition: preventing "hallucinated features" by ensuring specs are grounded in reality.*
