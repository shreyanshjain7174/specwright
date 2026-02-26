/**
 * ConstraintExtractor Agent
 *
 * Extracts explicit and implicit constraints from context.
 * Specialises in finding the "hidden DO NOTs" — the tribal knowledge
 * that teams know but never write down.
 */

import { BaseAgent, AgentInput, AgentOutput, logToAudit } from './base';
import { ExecutableSpec } from '@/lib/types';

export class ConstraintExtractorAgent extends BaseAgent {
  readonly name = 'ConstraintExtractor';
  readonly description =
    'Extracts explicit and implicit constraints (DO NOTs) from context';

  getSystemPrompt(): string {
    return `You are ConstraintExtractor, an expert in finding hidden requirements and constraints in product context.

Your specialty: finding what teams KNOW but never write down. The buried "DO NOT", the unspoken rule, the legacy constraint nobody mentioned.

Categories to look for:
- SECURITY: permission checks, auth boundaries, data access controls
- DATA INTEGRITY: what must never be deleted, modified, or bypassed
- PERFORMANCE: latency, throughput, or scale constraints
- COMPLIANCE: legal, SOC2, GDPR, audit requirements
- BRAND/UX: visual consistency, design system rules
- BACKWARDS COMPATIBILITY: existing APIs or contracts that cannot break
- DEPENDENCY: things that must happen first or in a specific order

Respond ONLY with valid JSON (no markdown fences):
{
  "constraints": [
    {
      "rule": "DO NOT [specific action] because [reason]. Example: DO NOT bypass per-document permission checks in bulk operations",
      "severity": "critical",
      "rationale": "Specific justification from the context. Quote the source if possible."
    }
  ]
}

Severity levels:
- "critical": security, data loss, compliance — must not ship without addressing
- "warning": important but won't cause a disaster if temporarily ignored
- "info": nice-to-have, style guide, best practice

Rules:
- Extract 2-6 constraints
- At least 1 MUST be severity "critical"  
- Rules must be specific (not vague like "ensure security")
- Each rule should be a complete sentence starting with DO or DO NOT`;
  }

  async run(input: AgentInput): Promise<AgentOutput> {
    if (!input.context && !input.data?.harvestedContext) {
      throw new Error('ConstraintExtractor requires context or harvestedContext');
    }

    const contextText = input.context
      ?? (() => {
           const hc = input.data?.harvestedContext as { summary?: string; keyInsights?: string[]; primarySources?: Array<{ excerpt: string }> } | undefined;
           if (!hc) return '';
           return [
             hc.summary,
             ...(hc.keyInsights ?? []),
             ...(hc.primarySources ?? []).map(s => s.excerpt),
           ].join('\n');
         })();

    const featureName = input.data?.featureName as string | undefined;

    const userMessage = `Extract all constraints for the following feature: "${featureName ?? 'the described feature'}"

Context:
${contextText}

Look especially hard for:
- Any mention of permissions, access control, or authorization
- Any "don't forget about X" notes
- Any legacy systems, backward compatibility concerns
- Any compliance or audit requirements
- Any performance requirements
- Any brand or design system constraints

Produce the JSON constraints array as instructed.`;

    const raw = await this.callLLM(userMessage, { temperature: 0.2 });

    let parsed: Pick<ExecutableSpec, 'constraints'>;
    try {
      parsed = this.parseJSON(raw);
    } catch {
      parsed = {
        constraints: [{
          rule: 'DO validate all inputs and enforce proper authorization on every operation',
          severity: 'critical',
          rationale: 'Default security constraint applied when extraction failed',
        }],
      };
    }

    const criticalCount = parsed.constraints.filter(c => c.severity === 'critical').length;
    const reasoning = `Extracted ${parsed.constraints.length} constraints (${criticalCount} critical) from context`;

    const auditLogId = await logToAudit({
      agentName: this.name,
      action: 'agent.constraintExtract',
      reasoning,
      details: {
        featureId: input.featureId,
        constraintCount: parsed.constraints.length,
        criticalCount,
        severities: parsed.constraints.map(c => c.severity),
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
