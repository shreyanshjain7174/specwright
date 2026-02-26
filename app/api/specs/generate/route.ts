import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(request: NextRequest) {
    try {
        const { featureName } = await request.json();

        if (!featureName) {
            return NextResponse.json({ error: 'featureName is required' }, { status: 400 });
        }

        const sql = getDb();

        // Find the feature
        const features = await sql`
      SELECT id, name, description FROM features WHERE id = ${featureName} OR name = ${featureName}
    `;

        if (features.length === 0) {
            return NextResponse.json({ error: 'Feature not found' }, { status: 404 });
        }

        const feature = features[0];

        // Get all raw inputs (traces) for this feature
        const rawInputs = await sql`
      SELECT id, source, content, created_at
      FROM raw_inputs
      WHERE feature_id = ${feature.id}
      ORDER BY created_at DESC
    `;

        // Get all specs for this feature
        const specs = await sql`
      SELECT id, details, created_at
      FROM specs
      WHERE feature_id = ${feature.id}
      ORDER BY created_at DESC
    `;

        // Build traceable spec
        const traceableSpec = {
            feature: {
                id: feature.id,
                name: feature.name,
                description: feature.description,
            },
            specifications: specs.map((s: any) => ({
                id: s.id,
                details: s.details,
                createdAt: s.created_at,
            })),
            rawInputs: rawInputs.map((r: any) => ({
                id: r.id,
                source: r.source,
                content: r.content,
                createdAt: r.created_at,
            })),
            traceability: {
                totalRawInputs: rawInputs.length,
                totalSpecs: specs.length,
                sources: [...new Set(rawInputs.map((r: any) => r.source))],
            },
        };

        return NextResponse.json({ spec: traceableSpec });
    } catch (error) {
        console.error('Error generating spec:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to generate spec' },
            { status: 500 }
        );
    }
}
