import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(request: NextRequest) {
    try {
        const { source, content, linkedFeatureId } = await request.json();

        if (!source || !content || !linkedFeatureId) {
            return NextResponse.json(
                { error: 'source, content, and linkedFeatureId are required' },
                { status: 400 }
            );
        }

        const rawInputId = crypto.randomUUID();
        const sql = getDb();

        // Ensure feature exists
        const existing = await sql`SELECT id FROM features WHERE id = ${linkedFeatureId}`;
        if (existing.length === 0) {
            // Auto-create the feature with the ID as the name
            await sql`INSERT INTO features (id, name) VALUES (${linkedFeatureId}, ${linkedFeatureId})`;
        }

        // Mock embedding (1536-dim deterministic vector for MVP)
        const seed = content.length;
        const embedding = Array(1536).fill(0).map((_: number, i: number) => Math.sin(seed + i));
        const embeddingStr = `[${embedding.join(',')}]`;

        await sql`
      INSERT INTO raw_inputs (id, source, content, feature_id, embedding)
      VALUES (${rawInputId}, ${source}, ${content}, ${linkedFeatureId}, ${embeddingStr}::vector)
    `;

        // Update the feature's updated_at
        await sql`UPDATE features SET updated_at = NOW() WHERE id = ${linkedFeatureId}`;

        return NextResponse.json({
            id: rawInputId,
            source,
            featureId: linkedFeatureId,
            message: 'Context ingested successfully',
        });
    } catch (error) {
        console.error('Error ingesting context:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to ingest context' },
            { status: 500 }
        );
    }
}
