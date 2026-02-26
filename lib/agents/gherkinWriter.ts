/**
 * GherkinWriter Agent
 *
 * Writes the verification layer of an Executable Spec:
 * Given/When/Then scenarios in Gherkin syntax.
 * Covers happy paths, sad paths, and edge cases derived from constraints.
 */

import { BaseAgent, AgentInput, AgentOutput, logToAudit } from './base';
import { ExecutableSpec } from '@/lib/types';

export class GherkinWriterAgent extends BaseAgent {
  readonly name = 'GherkinWriter';
  readonly description =
    'Writes Given/When/Then Gherkin test scenarios for an Executable Spec';

  getSystemPrompt(): string {
    return `You are GherkinWriter, an expert QA lead who writes precise Gherkin test scenarios.

You write verification scenarios for Executable Specifications. Each scenario tests a specific behavior — not just the happy path, but also edge cases and failure modes derived from the constraints.

RULES:
1. Write at least 2 happy path scenarios and at least 2 failure/edge case scenarios
2. Each "critical" constraint must have at least one scenario that tests it
3. Given/When/Then items must be specific and testable (not vague like "Then it works")
4. Think like an adversary — what could go wrong?

Respond ONLY with valid JSON (no markdown fences):
{
  "verification": [
    {
      "scenario": "Human-readable scenario name (e.g. 'Authorized user bulk deletes own documents')",
      "given": ["Precondition 1 (concrete system state)", "Precondition 2"],
      "when": ["Specific user action or system event"],
      "then": ["Specific, measurable expected outcome 1", "Outcome 2"]
    }
  ]
}

Notes:
- Generate 3-6 scenarios total
- Scenario names should be descriptive enough to read as test case titles
- then[] items should be verifiable programmatically`;
  }

  async run(input: AgentInput): Promise<AgentOutput> {
    const narrative = input.data?.narrative as ExecutableSpec['narrative'] | undefined;
    const constraints = input.data?.constraints as ExecutableSpec['constraints'] | undefined;

    if (!narrative) {
      throw new Error('GherkinWriter requires narrative in input.data');
    }

    const constraintText = constraints && constraints.length > 0
      ? constraints.map(c => `[${c.severity.toUpperCase()}] ${c.rule}`).join('\n')
      : '(no explicit constraints provided)';

    const userMessage = `Write Gherkin test scenarios for this feature:

Title: ${narrative.title}
Objective: ${narrative.objective}
Rationale: ${narrative.rationale}

Constraints to test:
${constraintText}

Additional context: ${input.context ?? 'none'}

Generate the scenarios. Make sure critical constraints have dedicated failure-path tests.`;

    const raw = await this.callLLM(userMessage, { temperature: 0.3 });

    let parsed: Pick<ExecutableSpec, 'verification'>;
    try {
      parsed = this.parseJSON(raw);
    } catch {
      parsed = {
        verification: [{
          scenario: 'Basic happy path',
          given: ['User is authenticated'],
          when: ['User performs the primary action'],
          then: ['Action completes successfully', 'UI updates appropriately'],
        }],
      };
    }

    const reasoning = `Wrote ${parsed.verification.length} Gherkin scenarios covering ${constraints?.length ?? 0} constraints`;

    const auditLogId = await logToAudit({
      agentName: this.name,
      action: 'agent.gherkinWrite',
      reasoning,
      details: {
        featureId: input.featureId,
        scenarioCount: parsed.verification.length,
        constraintsCovered: constraints?.length ?? 0,
        scenarios: parsed.verification.map(v => v.scenario),
      },
      orgId: input.orgId,
      specId: input.specId,
    });

    return {
      success: true,
      reasoning,
      result: parsed,
      auditLogId,
    };
  }
}
