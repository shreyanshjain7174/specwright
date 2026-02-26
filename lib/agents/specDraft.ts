/**
 * SpecDraft Agent
 *
 * Generates the narrative and context-pointer layers of an Executable Spec
 * from a HarvestedContext. Produces a draft spec ready for constraint extraction.
 */

import { BaseAgent, AgentInput, AgentOutput, logToAudit } from './base';
import { ExecutableSpec } from '@/lib/types';
import { HarvestedContext } from './contextHarvester';

export class SpecDraftAgent extends BaseAgent {
  readonly name = 'SpecDraft';
  readonly description =
    'Generates the narrative and context layers of an Executable Spec';

  getSystemPrompt(): string {
    return `You are SpecDraft, a Senior Product Analyst who writes rigorous Executable Specifications.

Your job is to take synthesized context and write the narrative and context-pointer layers of a spec.

CRITICAL RULES:
1. Every claim must trace back to the provided context — do NOT invent information
2. The objective must be one concrete, measurable sentence
3. Context pointers must reference actual sources from the input
4. Write for an AI coding agent that will implement this spec — be precise

Respond ONLY with valid JSON (no markdown fences):
{
  "narrative": {
    "title": "Short, imperative feature title (e.g. 'Add Bulk Delete for Documents')",
    "objective": "One sentence: exactly what will be built and why",
    "rationale": "Business justification tied to specific evidence from context"
  },
  "contextPointers": [
    {
      "source": "Source name (e.g. 'Slack #product-requests', 'Jira PROJ-123')",
      "snippet": "The exact quote or specific data point from the context that supports this spec",
      "link": null
    }
  ]
}

Notes:
- contextPointers: 3-6 items, each must quote actual text from the provided context
- narrative.rationale: cite at least one specific number or quote from context`;
  }

  async run(input: AgentInput): Promise<AgentOutput> {
    const harvestedContext = input.data?.harvestedContext as HarvestedContext | undefined;
    const featureName = input.data?.featureName as string | undefined;

    if (!harvestedContext && !input.context) {
      throw new Error('SpecDraft requires harvestedContext or context in input');
    }

    const contextSummary = harvestedContext
      ? `Summary: ${harvestedContext.summary}\n\nKey Insights:\n${harvestedContext.keyInsights.map((i, n) => `${n + 1}. ${i}`).join('\n')}\n\nTop Sources:\n${harvestedContext.primarySources.map(s => `- [${s.sourceType}] ${s.excerpt}`).join('\n')}`
      : input.context ?? '';

    const userMessage = `Write the narrative and context layers for a spec about: "${featureName ?? 'the described feature'}"

Context:
${contextSummary}

Produce the JSON as instructed.`;

    const raw = await this.callLLM(userMessage, { temperature: 0.2 });

    let partial: Pick<ExecutableSpec, 'narrative' | 'contextPointers'>;
    try {
      partial = this.parseJSON(raw);
    } catch {
      // Fallback: construct minimal valid structure
      partial = {
        narrative: {
          title: featureName ?? 'Untitled Feature',
          objective: 'Implement the described feature',
          rationale: 'Based on provided context',
        },
        contextPointers: [],
      };
    }

    const reasoning = `Drafted spec narrative for "${partial.narrative.title}" with ${partial.contextPointers.length} context pointers`;

    const auditLogId = await logToAudit({
      agentName: this.name,
      action: 'agent.specDraft',
      reasoning,
      details: {
        featureId: input.featureId,
        featureName,
        contextPointerCount: partial.contextPointers.length,
        title: partial.narrative.title,
      },
      orgId: input.orgId,
      specId: input.specId,
    });

    return {
      success: true,
      reasoning,
      result: partial,
      auditLogId,
    };
  }
}
