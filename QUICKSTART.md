# Simulator Quick Start Guide

Get the Simulator running in 5 minutes.

## Prerequisites

- Node.js 18+ installed
- Anthropic API key ([get one here](https://console.anthropic.com/))

## Setup

### 1. Install Dependencies

```bash
cd reasoning-engine
npm install
```

### 2. Set API Key

```bash
# Option 1: Environment variable
export ANTHROPIC_API_KEY=sk-ant-your-key-here

# Option 2: .env.local file
echo "ANTHROPIC_API_KEY=sk-ant-your-key-here" > .env.local
```

### 3. Run Example

```bash
npm run simulate:example
```

**Expected output:**

```
🚀 Simulator Examples

📋 Example 1: Dark Mode Spec (Well-Defined)

Running simulation...

✅ Status: PASSED

📊 Summary:
   - Total Scenarios: 4
   - Passed: 4
   - Failed: 0
   - Coverage Score: 100%
   - Ambiguity Score: 15%

👤 Virtual User:
   - Persona: Intermediate technical user with design awareness
   - Experience Level: intermediate

💡 Suggestions (2):
   1. [medium] Add timing constraint for toggle animation
   2. [low] Add scenario for system-level dark mode integration

======================================================================

📋 Example 2: Search Feature Spec (Ambiguous)

Running simulation...

❌ Status: FAILED

📊 Summary:
   - Total Scenarios: 1
   - Passed: 0
   - Failed: 1
   - Coverage Score: 0%
   - Ambiguity Score: 95%

⚠️  Failures (5):
   1. [critical] "Results appear" is not measurable - define specific criteria
      Step: "Then results appear"
   2. [high] Search scope not specified - search what? (products, users, docs?)
   3. [high] No timing constraint - how fast should results appear?
   4. [medium] No empty results handling specified
   5. [medium] No error state defined (what if search fails?)

💡 Top Suggestions:
   1. [high] Replace "Results appear" with measurable criteria
      Example: "Then: Search results load within 500ms AND Display top 10 matches AND Sort by relevance score"
   2. [high] Specify search scope and sources
      Example: "Search indexes: product catalog, documentation, user profiles"
   3. [medium] Add edge case scenarios
      Example: "Given: No results found, When: User searches, Then: Display 'No results' message"

======================================================================

✅ Examples complete!
```

## Test Your Own Spec

### Create a Spec File

Create `my-spec.yaml`:

```yaml
spec_id: "my-feature-v1"
version: "1.0"
status: "draft"

narrative:
  title: "Your Feature Name"
  objective: "What you're trying to achieve"
  rationale: "Why this matters"

context_pointers: []

constraints:
  - id: "C1"
    rule: "A constraint that must be honored"
    source: "requirements.md"
    severity: "must"

verification:
  - scenario: "User does something"
    given: "User is in some state"
    when: "User performs an action"
    then: "System responds in this way"
```

### Run Simulation

```typescript
// test-my-spec.ts
import { simulateSpec } from './src/lib/simulator';
import * as fs from 'fs';
import * as yaml from 'js-yaml';

const spec = yaml.load(fs.readFileSync('my-spec.yaml', 'utf8'));
const result = await simulateSpec(spec);

console.log(JSON.stringify(result, null, 2));
```

```bash
npx tsx test-my-spec.ts
```

## API Usage

### Start Dev Server

```bash
npm run dev
```

Server runs at `http://localhost:3000`

### Send Request

```bash
curl -X POST http://localhost:3000/api/specs/simulate \
  -H "Content-Type: application/json" \
  -d '{
    "spec": {
      "spec_id": "test-spec",
      "version": "1.0",
      "status": "draft",
      "narrative": {
        "title": "Test Feature",
        "objective": "Test the simulator",
        "rationale": "Learning"
      },
      "context_pointers": [],
      "constraints": [],
      "verification": [
        {
          "scenario": "Basic test",
          "given": "System is ready",
          "when": "User does something",
          "then": "System responds"
        }
      ]
    }
  }'
```

## Troubleshooting

### Error: "ANTHROPIC_API_KEY not set"

**Solution:** Set the environment variable:
```bash
export ANTHROPIC_API_KEY=sk-ant-your-key-here
```

### Error: "Module not found"

**Solution:** Install dependencies:
```bash
npm install
```

### Simulation Times Out

**Solution:** Increase timeout in config:
```typescript
const result = await simulateSpec(spec, {
  timeout_ms: 120000  // 2 minutes
});
```

### "Invalid spec" Error

**Solution:** Check your spec has:
- `spec_id`
- `narrative.title`
- At least one `verification` scenario
- Each scenario has `given`, `when`, `then`

## Next Steps

1. **Read the docs:** `src/lib/simulator/README.md`
2. **Explore examples:** `src/lib/simulator/example.ts`
3. **Try your own specs:** Simulate real product specs
4. **Check output:** Review failures and suggestions
5. **Iterate:** Improve specs based on feedback

## Cost Estimation

**Per Simulation:**
- Simple spec: ~$0.01
- Medium spec: ~$0.03
- Complex spec: ~$0.10

**Monthly Budget Examples:**
- 10 specs/day: ~$30/month
- 50 specs/day: ~$150/month
- 100 specs/day: ~$300/month

## Support

- **Documentation:** `src/lib/simulator/README.md`
- **Project Context:** `reasoning-engine/CLAUDE.md`
- **Architecture:** `docs/architecture/system-design.md`

---

Happy simulating! 🚀
