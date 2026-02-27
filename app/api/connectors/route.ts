import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { ConnectorType } from '@/lib/connectors/types';

// Ensure connectors table exists
async function ensureTable() {
    const sql = getDb();
    await sql`
    CREATE TABLE IF NOT EXISTS connectors (
      id SERIAL PRIMARY KEY,
      type TEXT NOT NULL,
      name TEXT NOT NULL,
      config JSONB NOT NULL DEFAULT '{}',
      status TEXT DEFAULT 'disconnected',
      last_sync_at TIMESTAMPTZ,
      items_synced INT DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
}

export async function GET() {
    try {
        await ensureTable();
        const sql = getDb();
        const connectors = await sql`
      SELECT id, type, name, status, last_sync_at, items_synced, created_at
      FROM connectors ORDER BY created_at DESC
    `;
        return NextResponse.json({ connectors });
    } catch (error) {
        console.error('List connectors error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to list connectors' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        await ensureTable();
        const { type, name, credentials } = await request.json();

        if (!type || !name || !credentials) {
            return NextResponse.json(
                { error: 'type, name, and credentials are required' },
                { status: 400 }
            );
        }

        const sql = getDb();
        const result = await sql`
      INSERT INTO connectors (type, name, config, status)
      VALUES (${type}, ${name}, ${JSON.stringify(credentials)}, 'connected')
      RETURNING id, type, name, status, created_at
    `;

        return NextResponse.json({ connector: result[0] });
    } catch (error) {
        console.error('Create connector error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to create connector' },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { id } = await request.json();
        if (!id) {
            return NextResponse.json({ error: 'id is required' }, { status: 400 });
        }

        const sql = getDb();
        await sql`DELETE FROM connectors WHERE id = ${id}`;
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to delete' },
            { status: 500 }
        );
    }
}
