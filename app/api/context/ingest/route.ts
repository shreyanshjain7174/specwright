/**
 * POST /api/context/ingest
 *
 * Full implementation of the context ingestion API.
 * Accepts raw context from any source type, chunks it semantically,
 * generates embeddings, and stores to the database.
 *
 * Body:
 *   source       - SourceType: slack | jira | notion | transcript | github | other
 *   content      - Raw text content to ingest
 *   linkedFeatureId - (optional) Feature to link to
 *   orgId        - (optional) Organisation ID
 *   contextSourceId - (optional) Pre-existing context_sources row ID
 *   metadata     - (optional) Source metadata (url, author, timestamp, etc.)
 *
 * Returns:
 *   chunkCount, chunkIds, auditLogId
 */

import { NextRequest, NextResponse } from 'next/server';
import { ingestContext, SourceType } from '@/lib/context/ingestion';
import { getDb } from '@/lib/db';

const VALID_SOURCE_TYPES: SourceType[] = [
  'slack', 'jira', 'notion', 'transcript', 'github', 'other',
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      source,
      content,
      linkedFeatureId,
      orgId = null,
      contextSourceId = null,
      metadata = {},
    } = body;

    // ── Validation ────────────────────────────────────────────────────────
    if (!source) {
      return NextResponse.json({ error: 'source is required' }, { status: 400 });
    }
    if (!VALID_SOURCE_TYPES.includes(source as SourceType)) {
      return NextResponse.json(
        { error: `source must be one of: ${VALID_SOURCE_TYPES.join(', ')}` },
        { status: 400 },
      );
    }
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ error: 'content is required and must be non-empty' }, { status: 400 });
    }

    // ── Auto-create feature if linkedFeatureId provided but doesn't exist ─
    if (linkedFeatureId) {
      const sql = getDb();
      const existing = await sql`SELECT id FROM features WHERE id = ${linkedFeatureId}`;
      if (existing.length === 0) {
        await sql`
          INSERT INTO features (id, name) VALUES (${linkedFeatureId}, ${linkedFeatureId})
          ON CONFLICT (id) DO NOTHING
        `;
      }
    }

    // ── Run ingestion pipeline ─────────────────────────────────────────────
    const result = await ingestContext(
      {
        sourceType: source as SourceType,
        content,
        metadata,
      },
      linkedFeatureId ?? null,
      orgId,
      contextSourceId,
    );

    return NextResponse.json({
      success: true,
      chunkCount: result.chunkCount,
      chunkIds: result.chunkIds,
      sourceId: result.sourceId,
      featureId: result.featureId,
      auditLogId: result.auditLogId,
      message: `Successfully ingested ${result.chunkCount} chunks from ${source}`,
    });
  } catch (error) {
    console.error('[/api/context/ingest] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to ingest context' },
      { status: 500 },
    );
  }
}
