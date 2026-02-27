import { NextRequest, NextResponse } from 'next/server';
import { queryDocument, isPageIndexAvailable } from '@/lib/pageindex';

export async function POST(request: NextRequest) {
    try {
        if (!isPageIndexAvailable()) {
            return NextResponse.json(
                { error: 'PageIndex is not configured. Set PAGEINDEX_API_KEY environment variable.' },
                { status: 503 }
            );
        }

        const { docIds, question } = await request.json();

        if (!docIds || !Array.isArray(docIds) || docIds.length === 0) {
            return NextResponse.json(
                { error: 'At least one document ID is required' },
                { status: 400 }
            );
        }

        if (!question || typeof question !== 'string') {
            return NextResponse.json(
                { error: 'Question is required' },
                { status: 400 }
            );
        }

        const result = await queryDocument(docIds, question);

        return NextResponse.json({
            answer: result.answer,
            traces: result.traces,
            method: 'pageindex',
        });
    } catch (error: any) {
        console.error('Document query error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Query failed' },
            { status: 500 }
        );
    }
}
