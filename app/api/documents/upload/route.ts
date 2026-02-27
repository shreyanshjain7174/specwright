import { NextRequest, NextResponse } from 'next/server';
import { uploadDocument, isPageIndexAvailable } from '@/lib/pageindex';
import { getDb } from '@/lib/db';

export async function POST(request: NextRequest) {
    try {
        if (!isPageIndexAvailable()) {
            return NextResponse.json(
                { error: 'PageIndex is not configured. Set PAGEINDEX_API_KEY environment variable.' },
                { status: 503 }
            );
        }

        const formData = await request.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        if (!file.name.toLowerCase().endsWith('.pdf')) {
            return NextResponse.json(
                { error: 'Only PDF files are supported' },
                { status: 400 }
            );
        }

        // Max 50MB
        if (file.size > 50 * 1024 * 1024) {
            return NextResponse.json(
                { error: 'File too large. Maximum size is 50MB.' },
                { status: 400 }
            );
        }

        const buffer = Buffer.from(await file.arrayBuffer());

        // Upload to PageIndex
        const result = await uploadDocument(buffer, file.name);

        // Store reference in Neon
        const sql = getDb();
        await sql`
      CREATE TABLE IF NOT EXISTS documents (
        id SERIAL PRIMARY KEY,
        filename TEXT NOT NULL,
        pageindex_doc_id TEXT NOT NULL,
        status TEXT DEFAULT 'processing',
        page_count INT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;

        await sql`
      INSERT INTO documents (filename, pageindex_doc_id, status)
      VALUES (${file.name}, ${result.doc_id}, 'processing')
    `;

        return NextResponse.json({
            docId: result.doc_id,
            filename: file.name,
            status: 'processing',
        });
    } catch (error: any) {
        console.error('Document upload error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Upload failed' },
            { status: 500 }
        );
    }
}
