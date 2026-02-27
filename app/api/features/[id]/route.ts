import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

/**
 * GET /api/features/[id]
 * Returns full feature detail: feature metadata, all specs, and raw context inputs.
 * The [id] can be a UUID or a slug like "feature-audit-log-export".
 */
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    const { id } = await params;

    try {
        const sql = getDb();

        // Find by exact ID first, then try slug / partial name match
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let features: any[] = await sql`
      SELECT id, name, description, created_at, updated_at
      FROM features
      WHERE id = ${id}
      LIMIT 1
    `;

        if (features.length === 0) {
            // Try slug match (e.g. "feature-audit-log-export" → "Audit Log Export")
            const stripped = id.replace(/^feature-/, '').replace(/-/g, ' ');
             
            features = await sql`
        SELECT id, name, description, created_at, updated_at
        FROM features
        WHERE name ILIKE ${`%${stripped}%`}
        ORDER BY created_at DESC
        LIMIT 1
      `;
        }

        if (features.length === 0) {
            return NextResponse.json({ error: 'Feature not found' }, { status: 404 });
        }

        const feature = features[0];

        // Fetch all specs ordered newest first
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rawSpecs: any[] = await sql`
      SELECT id, title, details, status, content_hash, created_at
      FROM specs
      WHERE feature_id = ${feature.id}
      ORDER BY created_at DESC
    `;

        // Fetch all raw inputs
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rawInputs: any[] = await sql`
      SELECT id, source, content, created_at
      FROM raw_inputs
      WHERE feature_id = ${feature.id}
      ORDER BY created_at ASC
    `;

        // Build unique source types list
        const sources: string[] = [...new Set<string>(rawInputs.map((r) => String(r.source)))];

        const specifications = rawSpecs.map((s) => ({
            id: s.id,
            title: s.title,
            // Normalise: details may be JSONB (already parsed) or string
            details: typeof s.details === 'string' ? s.details : JSON.stringify(s.details),
            status: s.status,
            contentHash: s.content_hash,
            createdAt: s.created_at,
        }));

        const inputs = rawInputs.map((r) => ({
            id: r.id,
            source: r.source,
            content: r.content,
            createdAt: r.created_at,
        }));

        return NextResponse.json({
            spec: {
                feature: {
                    id: feature.id,
                    name: feature.name,
                    description: feature.description,
                },
                specifications,
                rawInputs: inputs,
                traceability: {
                    totalRawInputs: inputs.length,
                    totalSpecs: specifications.length,
                    sources,
                },
            },
        });
    } catch (error) {
        console.error('[GET /api/features/[id]] Error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to fetch feature' },
            { status: 500 },
        );
    }
}
