/**
 * Context Harvester Agent
 * Searches vector store and re-ranks results by relevance + recency
 */
import type { ContextChunk } from './types.js';

export interface RankingConfig {
  recencyWeight?: number;   // 0-1, how much to weight recency
  similarityWeight?: number; // 0-1, how much to weight vector similarity
  halfLifeDays?: number;
}

/**
 * Re-rank chunks by combining similarity score + time-decay weight
 */
export function rerankChunks(
  chunks: ContextChunk[],
  config: RankingConfig = {}
): ContextChunk[] {
  const { recencyWeight = 0.3, similarityWeight = 0.7, halfLifeDays = 30 } = config;

  const now = Date.now();

  return chunks
    .map((chunk) => {
      const timestamp = chunk.metadata.timestamp as string;
      const age = timestamp
        ? (now - new Date(timestamp).getTime()) / (1000 * 60 * 60 * 24)
        : 30;
      const recencyScore = Math.pow(2, -age / halfLifeDays);
      const combined = chunk.score * similarityWeight + recencyScore * recencyWeight;
      return { ...chunk, score: combined };
    })
    .sort((a, b) => b.score - a.score);
}

/**
 * Harvest the top-K most relevant context chunks for a query
 */
export function harvestContext(
  chunks: ContextChunk[],
  topK: number = 5,
  config: RankingConfig = {}
): ContextChunk[] {
  const ranked = rerankChunks(chunks, config);
  return ranked.slice(0, topK);
}
