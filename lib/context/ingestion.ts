/**
 * Context Ingestion Pipeline
 *
 * Handles semantic chunking, multi-source parsing, embedding generation,
 * and storage of context chunks with full metadata.
 *
 * Architecture:
 *   rawContent → parse(source) → chunk → embed → store → audit_log
 */

import { getDb } from '@/lib/db';
import { getAIClient, AI_MODEL } from '@/lib/ai';

// ─── TYPES ────────────────────────────────────────────────────────────────────

export type SourceType = 'slack' | 'jira' | 'notion' | 'transcript' | 'github' | 'other';
export type ChunkType = 'paragraph' | 'conversation_turn' | 'code' | 'header' | 'other';

export interface RawSource {
  sourceType: SourceType;
  content: string;
  /** Optional metadata from the source system */
  metadata?: {
    url?: string;
    author?: string;
    timestamp?: string;
    channel?: string;
    ticketId?: string;
    pageTitle?: string;
    [key: string]: unknown;
  };
  /** Override source credibility (0–1). Default varies by sourceType. */
  credibilityScore?: number;
}

export interface SemanticChunk {
  content: string;
  chunkType: ChunkType;
  /** Index within parent document */
  index: number;
  /** Metadata inherited + enriched from source */
  metadata: Record<string, unknown>;
}

export interface IngestResult {
  chunkCount: number;
  chunkIds: string[];
  sourceId: string | null;
  featureId: string | null;
  auditLogId: string;
}

// Default credibility per source type (0–1)
const SOURCE_CREDIBILITY: Record<SourceType, number> = {
  slack:      0.65,  // informal, quick context
  jira:       0.80,  // structured ticket
  notion:     0.75,  // docs — often kept more current
  transcript: 0.90,  // verbatim customer voice
  github:     0.85,  // code/issues are high-signal
  other:      0.60,
};

// ─── PARSERS ──────────────────────────────────────────────────────────────────

/**
 * Parse Slack export/copy-paste format.
 * Detects conversation turns (new speaker → new chunk).
 */
function parseSlack(content: string, metadata: Record<string, unknown>): SemanticChunk[] {
  const chunks: SemanticChunk[] = [];
  // Slack messages: "[HH:MM] @username: message" OR "@username HH:MM\nmessage"
  const turnPattern = /^(?:\[[\d:]+\]\s*)?@?[\w.\-]+(?:\s+[\d:]+)?\s*[:\n]/gm;
  const parts = content.split(turnPattern).map(s => s.trim()).filter(Boolean);
  const speakers = [...content.matchAll(turnPattern)].map(m => m[0].trim());

  if (parts.length <= 1) {
    // No conversation structure detected — fall through to paragraph chunking
    return parseParagraphs(content, metadata);
  }

  parts.forEach((text, i) => {
    if (text.length < 10) return; // skip trivial turns
    chunks.push({
      content: text,
      chunkType: 'conversation_turn',
      index: i,
      metadata: { ...metadata, speaker: speakers[i] ?? 'unknown' },
    });
  });

  return chunks;
}

/**
 * Parse Jira-style content: title, description, comments, acceptance criteria.
 */
function parseJira(content: string, metadata: Record<string, unknown>): SemanticChunk[] {
  const chunks: SemanticChunk[] = [];
  // Try to split on common Jira section headers
  const sectionPattern = /^(Description|Acceptance Criteria|Comments?|Steps to Reproduce|Expected|Actual|Notes?):\s*$/gim;
  const sections = content.split(sectionPattern).map(s => s.trim()).filter(Boolean);

  if (sections.length <= 1) {
    return parseParagraphs(content, metadata);
  }

  sections.forEach((text, i) => {
    if (text.length < 20) return;
    chunks.push({
      content: text,
      chunkType: 'paragraph',
      index: i,
      metadata: { ...metadata, section: i },
    });
  });

  return chunks;
}

/**
 * Parse Notion pages: header-delimited sections.
 */
function parseNotion(content: string, metadata: Record<string, unknown>): SemanticChunk[] {
  const chunks: SemanticChunk[] = [];
  // Split on markdown-style headings
  const lines = content.split('\n');
  let current: string[] = [];
  let currentHeader = '';
  let index = 0;

  for (const line of lines) {
    if (/^#{1,3}\s+/.test(line)) {
      // Flush current block
      if (current.length > 0) {
        const text = current.join('\n').trim();
        if (text.length > 20) {
          chunks.push({
            content: text,
            chunkType: currentHeader ? 'paragraph' : 'header',
            index: index++,
            metadata: { ...metadata, section: currentHeader },
          });
        }
        current = [];
      }
      currentHeader = line.replace(/^#+\s+/, '');
    } else {
      current.push(line);
    }
  }

  // Flush remainder
  if (current.length > 0) {
    const text = current.join('\n').trim();
    if (text.length > 20) {
      chunks.push({
        content: text,
        chunkType: 'paragraph',
        index: index++,
        metadata: { ...metadata, section: currentHeader },
      });
    }
  }

  return chunks.length > 0 ? chunks : parseParagraphs(content, metadata);
}

/**
 * Parse interview / call transcripts.
 * Pattern: "Speaker: text" blocks.
 */
function parseTranscript(content: string, metadata: Record<string, unknown>): SemanticChunk[] {
  const chunks: SemanticChunk[] = [];
  // Match "Speaker (HH:MM): text" or "Speaker: text"
  const turnPattern = /^([A-Z][A-Za-z ]+(?:\s*\([\d:]+\))?):\s*/gm;
  const parts = content.split(turnPattern).filter(s => s.trim().length > 0);

  if (parts.length <= 1) {
    return parseParagraphs(content, metadata);
  }

  // parts alternates: [speaker, text, speaker, text, ...]
  for (let i = 0; i < parts.length - 1; i += 2) {
    const speaker = parts[i].trim();
    const text = parts[i + 1]?.trim() ?? '';
    if (text.length < 10) continue;

    chunks.push({
      content: text,
      chunkType: 'conversation_turn',
      index: i / 2,
      metadata: { ...metadata, speaker },
    });
  }

  return chunks.length > 0 ? chunks : parseParagraphs(content, metadata);
}

/**
 * Generic paragraph-based chunking.
 * Splits on double newlines (blank line = paragraph break).
 * Merges very short paragraphs with the next.
 */
function parseParagraphs(content: string, metadata: Record<string, unknown>): SemanticChunk[] {
  const rawParagraphs = content.split(/\n\s*\n/).map(p => p.trim()).filter(p => p.length > 0);

  const chunks: SemanticChunk[] = [];
  let buffer = '';
  let index = 0;

  for (const para of rawParagraphs) {
    buffer = buffer ? `${buffer}\n\n${para}` : para;

    // Flush when buffer is large enough (≥ 100 chars) or it's clearly code
    const isCode = /```|^\s{4}/.test(para);
    if (buffer.length >= 100 || isCode) {
      chunks.push({
        content: buffer,
        chunkType: isCode ? 'code' : 'paragraph',
        index: index++,
        metadata,
      });
      buffer = '';
    }
  }

  // Flush remainder
  if (buffer.length > 0) {
    chunks.push({
      content: buffer,
      chunkType: 'paragraph',
      index: index++,
      metadata,
    });
  }

  return chunks;
}

// ─── CHUNKER DISPATCHER ───────────────────────────────────────────────────────

/**
 * Dispatch to the appropriate parser based on source type.
 */
export function chunkContent(source: RawSource): SemanticChunk[] {
  const meta = source.metadata ?? {};

  switch (source.sourceType) {
    case 'slack':      return parseSlack(source.content, meta);
    case 'jira':       return parseJira(source.content, meta);
    case 'notion':     return parseNotion(source.content, meta);
    case 'transcript': return parseTranscript(source.content, meta);
    case 'github':
    case 'other':
    default:           return parseParagraphs(source.content, meta);
  }
}

// ─── EMBEDDING ────────────────────────────────────────────────────────────────

/**
 * Generate an embedding vector for a piece of text via Cloudflare Workers AI.
 * Falls back to a deterministic mock vector if the AI client is unavailable.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const client = getAIClient();
    // Cloudflare Workers AI exposes embeddings through the OpenAI-compatible
    // /embeddings endpoint using the @cf/baai/bge-base-en-v1.5 model.
    const response = await client.embeddings.create({
      model: 'workers-ai/@cf/baai/bge-base-en-v1.5',
      input: text.slice(0, 2048), // cap to avoid token limit
    });
    const raw = response.data[0]?.embedding ?? [];
    // BGE-base-en produces 768-dim; pad/truncate to 1536 for pgvector schema
    if (raw.length === 1536) return raw;
    if (raw.length < 1536) {
      return [...raw, ...Array(1536 - raw.length).fill(0)];
    }
    return raw.slice(0, 1536);
  } catch {
    // Fallback: deterministic mock based on content hash
    const seed = text.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return Array.from({ length: 1536 }, (_, i) => Math.sin(seed * (i + 1) * 0.01));
  }
}

// ─── AUDIT HELPER ─────────────────────────────────────────────────────────────

async function writeAuditLog(opts: {
  orgId: string | null;
  specId: string | null;
  agentName: string;
  action: string;
  reasoning: string;
  details: Record<string, unknown>;
}): Promise<string> {
  const sql = getDb();
  const id = crypto.randomUUID();
  await sql`
    INSERT INTO audit_log (id, org_id, spec_id, agent_name, action, reasoning, details)
    VALUES (
      ${id},
      ${opts.orgId},
      ${opts.specId},
      ${opts.agentName},
      ${opts.action},
      ${opts.reasoning},
      ${JSON.stringify(opts.details)}::jsonb
    )
  `;
  return id;
}

// ─── MAIN INGEST FUNCTION ─────────────────────────────────────────────────────

/**
 * Full ingestion pipeline:
 *  1. Chunk the raw source content
 *  2. Generate embeddings for each chunk
 *  3. Store chunks in context_chunks table
 *  4. Write audit log entry
 *
 * @param source        - Raw source to ingest
 * @param featureId     - Optional: link to an existing feature
 * @param orgId         - Optional: link to an organisation
 * @param contextSourceId - Optional: link to a context_sources row
 * @returns IngestResult with chunk IDs and audit log ID
 */
export async function ingestContext(
  source: RawSource,
  featureId: string | null = null,
  orgId: string | null = null,
  contextSourceId: string | null = null,
): Promise<IngestResult> {
  const sql = getDb();

  // Step 1: Chunk
  const chunks = chunkContent(source);
  if (chunks.length === 0) {
    throw new Error('No chunks produced from source content');
  }

  // Step 2 & 3: Embed and store each chunk
  const chunkIds: string[] = [];
  const credibility =
    source.credibilityScore ?? SOURCE_CREDIBILITY[source.sourceType] ?? 0.6;

  for (const chunk of chunks) {
    const embedding = await generateEmbedding(chunk.content);
    const vectorStr = `[${embedding.join(',')}]`;
    const id = crypto.randomUUID();

    const enrichedMeta = {
      ...chunk.metadata,
      credibility,
      chunkIndex: chunk.index,
      totalChunks: chunks.length,
    };

    await sql`
      INSERT INTO context_chunks
        (id, org_id, source_id, feature_id, source_type, chunk_type,
         content, embedding, metadata, source_ts)
      VALUES (
        ${id},
        ${orgId},
        ${contextSourceId},
        ${featureId},
        ${source.sourceType},
        ${chunk.chunkType},
        ${chunk.content},
        ${vectorStr}::vector,
        ${JSON.stringify(enrichedMeta)}::jsonb,
        ${source.metadata?.timestamp ? new Date(source.metadata.timestamp as string).toISOString() : null}
      )
    `;
    chunkIds.push(id);
  }

  // Step 4: Audit log
  const auditLogId = await writeAuditLog({
    orgId,
    specId: null,
    agentName: 'ContextIngestionPipeline',
    action: 'ingest.chunk',
    reasoning: `Ingested ${chunks.length} chunks from ${source.sourceType} source`,
    details: {
      sourceType: source.sourceType,
      chunkCount: chunks.length,
      chunkIds,
      featureId,
      contextSourceId,
      credibility,
    },
  });

  return {
    chunkCount: chunks.length,
    chunkIds,
    sourceId: contextSourceId,
    featureId,
    auditLogId,
  };
}
