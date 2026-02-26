/**
 * ContextHarvester Agent
 *
 * Gathers and synthesizes relevant context from the stored context_chunks
 * for a given feature or query. Produces a structured context summary that
 * feeds into SpecDraft and ConstraintExtractor.
 */

import { BaseAgent, AgentInput, AgentOutput, logToAudit } from './base';
import { retrieveContext, ContextChunk } from '@/lib/context/retrieval';

export interface HarvestedContext {
  summary: string;
  keyInsights: string[];
  primarySources: Array<{
    sourceType: string;
    excerpt: string;
    relevance: number;
  }>;
  contextChunks: ContextChunk[];
}

export class ContextHarvesterAgent extends BaseAgent {
  readonly name = 'ContextHarvester';
  readonly description =
    'Retrieves and synthesizes relevant context chunks for a feature or query';

  getSystemPrompt(): string {
    return `You are ContextHarvester, an expert at reading product context and extracting signal from noise.

Given a set of context chunks (from Slack, Jira, Notion, transcripts, etc.), your job is to:
1. Identify the most critical insights for product specification
2. Spot patterns and recurring themes
3. Surface hidden requirements that aren't explicitly stated
4. Group related information by theme

Respond ONLY with valid JSON matching this exact structure (no markdown fences):
{
  "summary": "A 2-3 sentence synthesis of the most important context",
  "keyInsights": ["Insight 1 (specific, actionable)", "Insight 2", "..."],
  "primarySources": [
    {
      "sourceType": "slack|jira|notion|transcript|github|other",
      "excerpt": "The most relevant quote or data point from this source",
      "relevance": 0.95
    }
  ]
}

Rules:
- keyInsights should be 3-8 specific, actionable insights
- primarySources should list the top 3-5 most relevant chunks
- Never invent information not present in the chunks
- If chunks are contradictory, call that out in the summary`;
  }

  async run(input: AgentInput): Promise<AgentOutput> {
    if (!input.context && !input.featureId) {
      throw new Error('ContextHarvester requires either context text or featureId');
    }

    // Build the query from feature name or provided context snippet
    const query = input.context ?? `feature ${input.featureId}`;

    // Retrieve relevant chunks from DB
    const chunks = await retrieveContext(query, {
      featureId: input.featureId,
      orgId: input.orgId,
      topK: 15,
    });

    // If we also have inline context, prepend it as a synthetic chunk
    const contextText = chunks.length > 0
      ? chunks
          .map((c, i) => `[Source ${i + 1}: ${c.sourceType}]\n${c.content}`)
          .join('\n\n---\n\n')
      : input.context ?? '(no context available)';

    const userMessage = `Synthesize the following context chunks for a product feature:

${contextText}

${input.context ? `\nAdditional inline context:\n${input.context}` : ''}

Produce the structured JSON summary as instructed.`;

    const raw = await this.callLLM(userMessage);

    let parsed: Omit<HarvestedContext, 'contextChunks'>;
    try {
      parsed = this.parseJSON(raw);
    } catch {
      // Graceful degradation
      parsed = {
        summary: raw.slice(0, 500),
        keyInsights: [],
        primarySources: [],
      };
    }

    const result: HarvestedContext = { ...parsed, contextChunks: chunks };

    const reasoning = `Retrieved ${chunks.length} context chunks and synthesized ${parsed.keyInsights.length} key insights`;

    const auditLogId = await logToAudit({
      agentName: this.name,
      action: 'agent.contextHarvest',
      reasoning,
      details: {
        featureId: input.featureId,
        chunksRetrieved: chunks.length,
        insightCount: parsed.keyInsights.length,
      },
      orgId: input.orgId,
      specId: input.specId,
    });

    return {
      success: true,
      reasoning,
      result,
      auditLogId,
    };
  }
}
