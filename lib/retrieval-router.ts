/**
 * Hybrid Retrieval Router
 *
 * Routes context to the optimal retrieval method:
 *   - Short-form (Slack, Jira, <500 tokens): Direct pass-through
 *   - Long-form docs (PDFs uploaded to PageIndex): Reasoning-based retrieval
 *
 * Both paths produce a unified RetrievalResult.
 */

import { queryDocument, isPageIndexAvailable, type RetrievalTrace } from './pageindex';

// ─── Types ──────────────────────────────────────────────────────────────────────

export interface RetrievalResult {
    content: string;
    source: string;
    method: 'direct' | 'pageindex';
    traces?: RetrievalTrace[];
}

export interface RetrievalInput {
    /** Raw pasted context (always present) */
    rawContext: string;
    /** PageIndex document IDs to query (optional) */
    documentIds?: string[];
}

// ─── Token Estimation ───────────────────────────────────────────────────────────

/** Rough token count — ~4 chars per token for English text */
function estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
}

// ─── Router ─────────────────────────────────────────────────────────────────────

/**
 * Retrieve relevant context using the optimal method for each input type.
 * Returns an array of retrieval results from all sources.
 */
export async function retrieveContext(
    input: RetrievalInput
): Promise<RetrievalResult[]> {
    const results: RetrievalResult[] = [];

    // 1. Direct context — always include the raw pasted context
    if (input.rawContext.trim()) {
        results.push({
            content: input.rawContext,
            source: 'Pasted context',
            method: 'direct',
        });
    }

    // 2. PageIndex reasoning retrieval — for uploaded documents
    if (
        input.documentIds?.length &&
        isPageIndexAvailable()
    ) {
        try {
            // Build a retrieval question from the raw context
            const question = buildRetrievalQuestion(input.rawContext);

            const queryResult = await queryDocument(
                input.documentIds,
                question
            );

            if (queryResult.answer) {
                results.push({
                    content: queryResult.answer,
                    source: `PageIndex reasoning retrieval (${input.documentIds.length} doc${input.documentIds.length > 1 ? 's' : ''})`,
                    method: 'pageindex',
                    traces: queryResult.traces,
                });
            }
        } catch (error) {
            console.error('PageIndex retrieval failed, falling back to direct context:', error);
            // Graceful degradation — we still have the direct context
        }
    }

    return results;
}

/**
 * Build a retrieval question to extract relevant context from documents.
 * This is used when querying PageIndex to find the most relevant sections.
 */
function buildRetrievalQuestion(rawContext: string): string {
    const truncated =
        rawContext.length > 2000 ? rawContext.slice(0, 2000) + '...' : rawContext;

    return `Based on the following product context, extract ALL relevant requirements, constraints, prior decisions, technical limitations, and domain-specific rules that would be needed to write a complete product specification:

${truncated}

Focus on:
1. Any constraints or "DO NOT" rules hiding in the documents
2. Security, permission, or compliance requirements
3. Technical architecture decisions that affect implementation
4. Previous decisions or precedents that constrain this feature
5. Edge cases, failure modes, or known gotchas`;
}

/**
 * Merge multiple retrieval results into a single context string
 * for the spec compilation prompt.
 */
export function mergeRetrievalResults(results: RetrievalResult[]): string {
    if (results.length === 0) return '';
    if (results.length === 1) return results[0].content;

    return results
        .map((r, i) => {
            const label =
                r.method === 'pageindex'
                    ? `[SOURCE ${i + 1} — PageIndex Reasoning Retrieval]`
                    : `[SOURCE ${i + 1} — Direct Context]`;
            return `${label}\n${r.content}`;
        })
        .join('\n\n---\n\n');
}
