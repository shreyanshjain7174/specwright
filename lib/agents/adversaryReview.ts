/**
 * AdversaryReview Agent
 *
 * Red-teams the complete Executable Spec to find:
 *   - Ambiguous requirements
 *   - Missing constraints
 *   - Contradictions between constraints and verification
 *   - Security gaps
 *   - Implementation traps
 *
 * This is the final review step before the spec is approved.
 */

import { BaseAgent, AgentInput, AgentOutput, logToAudit } from './base';
import { ExecutableSpec } from '@/lib/types';

export interface AdversaryReviewResult {
  approved: boolean;
  issues: Array<{
    severity: 'blocker' | 'warning' | 'suggestion';
    category: 'ambiguity' | 'missing_constraint' | 'contradiction' | 'security' | 'testability';
    description: string;
    location: string;  // which part of the spec has the issue
    suggestion: string;
  }>;
  overallVerdict: string;  // summary assessment
}

export class AdversaryReviewAgent extends BaseAgent {
  readonly name = 'AdversaryReview';
  readonly description =
    'Red-teams the complete spec to find ambiguities, contradictions, and security gaps';

  getSystemPrompt(): string {
    return `You are AdversaryReview, a deeply skeptical senior engineer whose job is to FIND PROBLEMS in Executable Specifications before any code is written.

Your philosophy: "Every spec has a bug. Your job is to find it."

Look for:
1. AMBIGUITY: Requirements that could be interpreted multiple ways by different engineers
2. MISSING CONSTRAINTS: Critical rules that are implied but not stated
3. CONTRADICTIONS: Places where constraints conflict with each other or with verification scenarios
4. SECURITY GAPS: Any operation that touches user data, permissions, or external systems without explicit auth checks
5. TESTABILITY: Verification scenarios that cannot be automated or measured

Severity:
- "blocker": Spec CANNOT ship without addressing this — would cause bugs, security holes, or undefined behavior
- "warning": Should be addressed but won't cause a disaster
- "suggestion": Nice to have

Approved = true only if there are ZERO blocker issues.

Respond ONLY with valid JSON (no markdown fences):
{
  "approved": false,
  "issues": [
    {
      "severity": "blocker|warning|suggestion",
      "category": "ambiguity|missing_constraint|contradiction|security|testability",
      "description": "Specific description of the problem",
      "location": "narrative|contextPointers|constraints|verification|constraints[0]",
      "suggestion": "Concrete action to fix this issue"
    }
  ],
  "overallVerdict": "2-3 sentence honest assessment of the spec quality"
}

Be aggressive. Find real problems. A spec that passes your review with zero blockers is genuinely ready for implementation.`;
  }

  async run(input: AgentInput): Promise<AgentOutput> {
    const spec = input.data?.spec as ExecutableSpec | undefined;

    if (!spec) {
      throw new Error('AdversaryReview requires a complete spec in input.data.spec');
    }

    const userMessage = `Red-team this Executable Specification and find every problem:

${JSON.stringify(spec, null, 2)}

Be thorough. Think like a senior engineer who has to implement this and finds the spec ambiguous or incomplete. Think like a security researcher looking for permission bypasses. Think like a QA lead trying to write tests for the verification scenarios.

Report all issues you find.`;

    const raw = await this.callLLM(userMessage, { temperature: 0.4, maxTokens: 4096 });

    let parsed: AdversaryReviewResult;
    try {
      parsed = this.parseJSON(raw);
    } catch {
      parsed = {
        approved: false,
        issues: [{
          severity: 'warning',
          category: 'ambiguity',
          description: 'Could not parse adversary review — manual review required',
          location: 'entire spec',
          suggestion: 'Re-run adversary review or perform manual review',
        }],
        overallVerdict: 'Adversary review failed to parse. Please re-run.',
      };
    }

    const blockerCount = parsed.issues.filter(i => i.severity === 'blocker').length;
    const reasoning = `Red-teamed spec: found ${parsed.issues.length} issues (${blockerCount} blockers). Approved: ${parsed.approved}`;

    const auditLogId = await logToAudit({
      agentName: this.name,
      action: 'agent.adversaryReview',
      reasoning,
      details: {
        specId: input.specId,
        approved: parsed.approved,
        issueCount: parsed.issues.length,
        blockerCount,
        warningCount: parsed.issues.filter(i => i.severity === 'warning').length,
        categories: [...new Set(parsed.issues.map(i => i.category))],
        verdict: parsed.overallVerdict,
      },
      orgId: input.orgId,
      specId: input.specId,
    });

    return {
      success: true,
      reasoning,
      result: parsed,
      auditLogId,
      warnings: parsed.issues
        .filter(i => i.severity === 'blocker')
        .map(i => i.description),
    };
  }
}
