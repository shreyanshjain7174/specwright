/**
 * Semantic Chunker - splits raw input into meaningful chunks
 * preserving conversation turns and semantic boundaries
 */

export interface Chunk {
  id: string;
  text: string;
  metadata: ChunkMetadata;
  embedding?: number[];
}

export interface ChunkMetadata {
  source_type: string;
  source_id: string;
  feature_id: string;
  chunk_index: number;
  total_chunks: number;
  timestamp: string;
  weight?: number;
  speaker?: string;
}

const CONVERSATION_SEPARATORS = /\n(?=[A-Z][a-zA-Z]+:)/;
const MAX_CHUNK_SIZE = 512; // tokens approximated by chars/4

/**
 * Splits text into semantic chunks, preserving conversation turns
 */
export function semanticChunk(
  text: string,
  metadata: Omit<ChunkMetadata, 'chunk_index' | 'total_chunks'>
): Chunk[] {
  // Detect if this is a conversation transcript
  const isConversation = CONVERSATION_SEPARATORS.test(text);

  let rawChunks: string[];
  if (isConversation) {
    // Preserve conversation turns as atomic units — do NOT merge them
    rawChunks = text
      .split(CONVERSATION_SEPARATORS)
      .map((s) => s.trim())
      .filter(Boolean);
  } else {
    // Split by paragraph/sentence boundaries, then normalize
    const paragraphs = text
      .split(/\n\n+/)
      .flatMap((para) => splitBySentence(para))
      .map((s) => s.trim())
      .filter(Boolean);
    rawChunks = normalizeSizes(paragraphs);
  }

  const total_chunks = rawChunks.length;

  return rawChunks.map((text, chunk_index) => ({
    id: `${metadata.source_id}-chunk-${chunk_index}`,
    text,
    metadata: {
      ...metadata,
      chunk_index,
      total_chunks,
      speaker: extractSpeaker(text),
    },
  }));
}

function splitBySentence(text: string): string[] {
  if (text.length <= MAX_CHUNK_SIZE * 4) return [text];
  return text.split(/(?<=[.!?])\s+/).filter(Boolean);
}

function normalizeSizes(chunks: string[]): string[] {
  const result: string[] = [];
  let buffer = '';

  for (const chunk of chunks) {
    if (buffer.length + chunk.length > MAX_CHUNK_SIZE * 4) {
      if (buffer) result.push(buffer.trim());
      buffer = chunk;
    } else {
      buffer = buffer ? `${buffer}\n${chunk}` : chunk;
    }
  }
  if (buffer.trim()) result.push(buffer.trim());
  return result;
}

function extractSpeaker(text: string): string | undefined {
  const match = text.match(/^([A-Z][a-zA-Z]+):/);
  return match ? match[1] : undefined;
}

/**
 * Calculate time-decay weight for a chunk based on its age
 * More recent = higher weight. Half-life = 30 days.
 */
export function calculateTimeDecayWeight(timestamp: string, halfLifeDays = 30): number {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  if (isNaN(then)) throw new Error(`Invalid timestamp: ${timestamp}`);

  const ageMs = now - then;
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  // Exponential decay: weight = 2^(-age/halfLife)
  return Math.pow(2, -ageDays / halfLifeDays);
}
