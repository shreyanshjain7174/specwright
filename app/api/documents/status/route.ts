import { NextRequest, NextResponse } from 'next/server';
import { getDocumentStatus, isPageIndexAvailable } from '@/lib/pageindex';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
    try {
        if (!isPageIndexAvailable()) {
            return NextResponse.json(
                { error: 'PageIndex is not configured' },
                { status: 503 }
            );
        }

        const docId = request.nextUrl.searchParams.get('docId');

        if (!docId) {
            // Return all documents
            const sql = getDb();
            const docs = await sql`
        SELECT id, filename, pageindex_doc_id, status, page_count, created_at
        FROM documents
        ORDER BY created_at DESC
        LIMIT 20
      `;

            return NextResponse.json({ documents: docs });
        }

        // Check status from PageIndex
        const status = await getDocumentStatus(docId);

        // Update local DB if status changed
        if (status.status === 'completed' || status.status === 'failed') {
            const sql = getDb();
            await sql`
        UPDATE documents
        SET status = ${status.status},
            page_count = ${status.page_count ?? null}
        WHERE pageindex_doc_id = ${docId}
      `;
        }

        return NextResponse.json({
            docId: status.doc_id,
            status: status.status,
            pageCount: status.page_count,
        });
    } catch (error: any) {
        console.error('Document status error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Status check failed' },
            { status: 500 }
        );
    }
}
