import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { syncSlack } from '@/lib/connectors/slack';
import { syncJira } from '@/lib/connectors/jira';
import { syncNotion } from '@/lib/connectors/notion';
import { syncGong } from '@/lib/connectors/gong';
import { syncConfluence } from '@/lib/connectors/confluence';
import { ConnectorType, ImportedItem } from '@/lib/connectors/types';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const sql = getDb();

        // Get connector config
        const connectors = await sql`
      SELECT id, type, name, config FROM connectors WHERE id = ${id}
    `;

        if (connectors.length === 0) {
            return NextResponse.json({ error: 'Connector not found' }, { status: 404 });
        }

        const connector = connectors[0];
        const credentials = typeof connector.config === 'string'
            ? JSON.parse(connector.config)
            : connector.config;

        // Update status to syncing
        await sql`UPDATE connectors SET status = 'syncing' WHERE id = ${id}`;

        // Run sync based on type
        let syncResult;
        switch (connector.type as ConnectorType) {
            case 'slack':
                syncResult = await syncSlack(credentials);
                break;
            case 'jira':
                syncResult = await syncJira(credentials);
                break;
            case 'notion':
                syncResult = await syncNotion(credentials);
                break;
            case 'gong':
                syncResult = await syncGong(credentials);
                break;
            case 'confluence':
                syncResult = await syncConfluence(credentials);
                break;
            default:
                return NextResponse.json(
                    { error: `Unknown connector type: ${connector.type}` },
                    { status: 400 }
                );
        }

        // Ingest imported items as raw context
        for (const item of syncResult.items) {
            try {
                await sql`
          INSERT INTO raw_inputs (feature_id, source, content, metadata)
          VALUES (
            NULL,
            ${item.sourceType},
            ${item.content},
            ${JSON.stringify({ ...item.metadata, title: item.title, sourceId: item.sourceId })}
          )
          ON CONFLICT DO NOTHING
        `;
            } catch {
                // Non-fatal — continue with other items
            }
        }

        // Update connector status
        await sql`
      UPDATE connectors
      SET status = ${syncResult.result.success ? 'connected' : 'error'},
          last_sync_at = NOW(),
          items_synced = COALESCE(items_synced, 0) + ${syncResult.result.itemsImported}
      WHERE id = ${id}
    `;

        return NextResponse.json({
            success: syncResult.result.success,
            itemsImported: syncResult.result.itemsImported,
            errors: syncResult.result.errors,
            duration: syncResult.result.duration,
        });
    } catch (error) {
        console.error('Connector sync error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Sync failed' },
            { status: 500 }
        );
    }
}
