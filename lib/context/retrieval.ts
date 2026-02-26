/**
 * Context Retrieval — Hybrid Search
 *
 * Combines:
 *   1. Vector similarity (cosine distance via pgvector)
 *   2. Temporal decay (recent content scores higher)
 *   3. Source credibility (stored in chunk metadata)
 *
 * Final score = vector_score * temporal_factor * credibility
 *
 * Results are re-ranked by final score and returned as ContextChunk[].
 */

import { getDb } from '@/lib/db';
import { generateEmbedding } from './ingestion';

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface ContextChunk {
  id: string;
  content: string;
  sourceType: string;
  chunkType: string;
  metadata: Record<string, unknown>;
  sourceTs: Date | null;
  vectorScore: number;   // raw cosine similarity (0–1)
  temporalScore: number; // time-decay factor (0–1)
  credibility: number;   // source credibility (0–1)
  finalScore: number;    // combined ranking score
}

export interface RetrievalOptions {
  /** Maximum number of results to return (default 10) */
  topK?: number;
  /** Filter by source type */
  sourceType?: string;
  /** Filter by org */
  orgId?: string;
  /** Filter by feature */
  featureId?: string;
  /** Half-life for temporal decay in days (default 30) */
  decayHalfLifeDays?: number;
  /** Minimum final score threshold (default 0.1) */
  minScore?: number;
}

// ─── TEMPORAL DECAY ───────────────────────────────────────────────────────────

/**
 * Exponential time-decay function.
 * score = exp(-ln(2) * ageInDays / halfLifeDays)
 * At age=0 → 1.0; at age=halfLife → 0.5; at age=2*halfLife → 0.25
 */
function temporalDecay(sourceTs: Date | null, halfLifeDays: number): number {
  if (!sourceTs) return 0.8; // unknown age — moderate penalty

  const ageMs = Date.now() - sourceTs.getTime();
  const ageInDays = ageMs / (1000 * 60 * 60 * 24);

  return Math.exp(-Math.LN2 * ageInDays / halfLifeDays);
}

// ─── RETRIEVAL ────────────────────────────────────────────────────────────────

/**
 * Retrieve semantically similar context chunks for a given query.
 *
 * @param query   - Natural language query
 * @param options - Retrieval configuration
 * @returns Ordered list of ContextChunk (highest finalScore first)
 */
export async function retrieveContext(
  query: string,
  options: RetrievalOptions = {},
): Promise<ContextChunk[]> {
  const {
    topK = 10,
    sourceType,
    orgId,
    featureId,
    decayHalfLifeDays = 30,
    minScore = 0.05,
  } = options;

  const sql = getDb();

  // Step 1: Embed the query
  const queryEmbedding = await generateEmbedding(query);
  const vectorStr = `[${queryEmbedding.join(',')}]`;

  // Step 2: Vector search — retrieve top 50 candidates for re-ranking
  // Using cosine distance (<=>). Lower distance = higher similarity.
  // similarity = 1 - distance
  const candidates = await sql`
    SELECT
      id,
      content,
      source_type,
      chunk_type,
      metadata,
      source_ts,
      1 - (embedding <=> ${vectorStr}::vector) AS vector_score
    FROM context_chunks
    WHERE
      embedding IS NOT NULL
      ${orgId ? sql`AND org_id = ${orgId}` : sql``}
      ${featureId ? sql`AND feature_id = ${featureId}` : sql``}
      ${sourceType ? sql`AND source_type = ${sourceType}` : sql``}
    ORDER BY embedding <=> ${vectorStr}::vector
    LIMIT 50
  `;

  if (candidates.length === 0) return [];

  // Step 3: Re-rank with temporal decay and source credibility
  const results: ContextChunk[] = candidates.map((row: any) => {
    const meta: Record<string, unknown> = row.metadata ?? {};
    const credibility = typeof meta.credibility === 'number' ? meta.credibility : 0.7;
    const vectorScore = Math.max(0, Math.min(1, Number(row.vector_score)));
    const temporalScore = temporalDecay(
      row.source_ts ? new Date(row.source_ts) : null,
      decayHalfLifeDays,
    );

    // Weighted combination
    // Vector similarity is the primary signal; temporal and credibility are multipliers
    const finalScore = vectorScore * temporalScore * credibility;

    return {
      id: row.id,
      content: row.content,
      sourceType: row.source_type,
      chunkType: row.chunk_type,
      metadata: meta,
      sourceTs: row.source_ts ? new Date(row.source_ts) : null,
      vectorScore,
      temporalScore,
      credibility,
      finalScore,
    };
  });

  // Step 4: Filter by minimum score, sort by finalScore descending, take topK
  return results
    .filter(r => r.finalScore >= minScore)
    .sort((a, b) => b.finalScore - a.finalScore)
    .slice(0, topK);
}

// ─── CONVENIENCE HELPERS ──────────────────────────────────────────────────────

/**
 * Retrieve context and format it as a single string for LLM prompts.
 *
 * @param query   - Natural language query
 * @param options - Retrieval options
 * @returns Formatted context string ready to inject into a prompt
 */
export async function retrieveContextAsText(
  query: string,
  options: RetrievalOptions = {},
): Promise<string> {
  const chunks = await retrieveContext(query, options);

  if (chunks.length === 0) {
    return '(No relevant context found)';
  }

  return chunks
    .map((c, i) => {
      const age = c.sourceTs
        ? `${Math.round((Date.now() - c.sourceTs.getTime()) / 86_400_000)}d ago`
        : 'unknown age';
      return `[${i + 1}] Source: ${c.sourceType} | ${age} | Score: ${c.finalScore.toFixed(2)}\n${c.content}`;
    })
    .join('\n\n---\n\n');
}
