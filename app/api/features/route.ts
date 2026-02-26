import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
    try {
        const sql = getDb();
        const features = await sql`
      SELECT f.id, f.name, f.description, f.created_at, f.updated_at,
             COUNT(DISTINCT r.id) as raw_input_count,
             COUNT(DISTINCT s.id) as spec_count
      FROM features f
      LEFT JOIN raw_inputs r ON r.feature_id = f.id
      LEFT JOIN specs s ON s.feature_id = f.id
      GROUP BY f.id
      ORDER BY f.updated_at DESC
    `;
        return NextResponse.json({ features });
    } catch (error) {
        console.error('Error listing features:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to list features' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const { id, name, description } = await request.json();

        if (!name) {
            return NextResponse.json({ error: 'name is required' }, { status: 400 });
        }

        const featureId = id || crypto.randomUUID();
        const sql = getDb();

        await sql`
      INSERT INTO features (id, name, description)
      VALUES (${featureId}, ${name}, ${description || ''})
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        updated_at = NOW()
    `;

        return NextResponse.json({ id: featureId, name, description });
    } catch (error) {
        console.error('Error creating feature:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to create feature' },
            { status: 500 }
        );
    }
}
