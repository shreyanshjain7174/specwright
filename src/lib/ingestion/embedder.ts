/**
 * Embedding module
 * Wraps AI embedding calls, returns 1536-dimensional vectors
 */

export const EMBEDDING_DIMENSIONS = 1536;

export interface EmbedderConfig {
  model?: string;
  apiKey?: string;
}

export type EmbedFn = (text: string) => Promise<number[]>;

/**
 * Deterministic mock embedding for testing (no API calls)
 * Returns a 1536-dimensional unit vector derived from the input text
 */
export function mockEmbed(text: string): number[] {
  const seed = text.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const vector = Array(EMBEDDING_DIMENSIONS)
    .fill(0)
    .map((_, i) => Math.sin((seed * (i + 1)) / EMBEDDING_DIMENSIONS));

  // Normalize to unit length
  const norm = Math.sqrt(vector.reduce((s, v) => s + v * v, 0));
  return vector.map((v) => v / norm);
}

/**
 * Validates that a vector has the correct dimensions
 */
export function validateEmbeddingDimensions(vector: number[]): boolean {
  return Array.isArray(vector) && vector.length === EMBEDDING_DIMENSIONS;
}

/**
 * Create an embedder function (mocked or real depending on config)
 */
export function createEmbedder(config?: EmbedderConfig): EmbedFn {
  // In test environment or when no API key, use mock
  if (process.env.NODE_ENV === 'test' || !config?.apiKey) {
    return async (text: string) => mockEmbed(text);
  }

  // Production: would call OpenAI / Cloudflare Workers AI
  return async (text: string) => {
    // Placeholder for real API call
    // const client = new OpenAI({ apiKey: config.apiKey });
    // const res = await client.embeddings.create({ model: 'text-embedding-3-small', input: text });
    // return res.data[0].embedding;
    return mockEmbed(text); // fallback for now
  };
}
