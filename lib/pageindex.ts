/**
 * PageIndex REST API Client
 *
 * Wraps the PageIndex cloud API for reasoning-based document retrieval.
 * See: https://docs.pageindex.ai/quickstart
 */

const PAGEINDEX_API_BASE = 'https://api.pageindex.ai';

function getApiKey(): string {
    const key = process.env.PAGEINDEX_API_KEY;
    if (!key) {
        throw new Error(
            'PAGEINDEX_API_KEY environment variable is not set. ' +
            'Get your key at https://dash.pageindex.ai/api-keys'
        );
    }
    return key;
}

function headers(): Record<string, string> {
    return {
        Authorization: `Bearer ${getApiKey()}`,
        'Content-Type': 'application/json',
    };
}

// ─── Types ──────────────────────────────────────────────────────────────────────

export interface PageIndexDocument {
    doc_id: string;
    status: 'processing' | 'completed' | 'failed';
    filename?: string;
    page_count?: number;
}

export interface TreeNode {
    title: string;
    node_id: string;
    start_index: number;
    end_index: number;
    summary: string;
    nodes?: TreeNode[];
}

export interface RetrievalTrace {
    node_id: string;
    title: string;
    page_range: [number, number];
    reasoning: string;
    content: string;
}

export interface QueryResult {
    answer: string;
    traces: RetrievalTrace[];
}

// ─── API Methods ────────────────────────────────────────────────────────────────

/**
 * Upload a document (PDF) to PageIndex for tree indexing.
 */
export async function uploadDocument(
    file: Buffer,
    filename: string
): Promise<{ doc_id: string }> {
    const formData = new FormData();
    const blob = new Blob([new Uint8Array(file)], { type: 'application/pdf' });
    formData.append('file', blob, filename);

    const response = await fetch(`${PAGEINDEX_API_BASE}/doc`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getApiKey()}` },
        body: formData,
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`PageIndex upload failed (${response.status}): ${error}`);
    }

    return response.json();
}

/**
 * Check the processing status of a document.
 */
export async function getDocumentStatus(
    docId: string
): Promise<PageIndexDocument> {
    const response = await fetch(`${PAGEINDEX_API_BASE}/doc/${docId}`, {
        headers: headers(),
    });

    if (!response.ok) {
        throw new Error(`PageIndex status check failed (${response.status})`);
    }

    return response.json();
}

/**
 * Get the hierarchical tree structure of a processed document.
 */
export async function getTree(docId: string): Promise<{ result: TreeNode }> {
    const response = await fetch(
        `${PAGEINDEX_API_BASE}/tree/${docId}`,
        { headers: headers() }
    );

    if (!response.ok) {
        throw new Error(`PageIndex tree fetch failed (${response.status})`);
    }

    return response.json();
}

/**
 * Reasoning-based retrieval: ask a question about a document.
 * Uses PageIndex's Chat Completions API for agentic RAG.
 */
export async function queryDocument(
    docId: string | string[],
    question: string
): Promise<QueryResult> {
    const response = await fetch(`${PAGEINDEX_API_BASE}/chat/completions`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({
            messages: [{ role: 'user', content: question }],
            doc_id: docId,
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`PageIndex query failed (${response.status}): ${error}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content ?? '';

    // Extract traces from response metadata if available
    const traces: RetrievalTrace[] = (data.traces ?? data.references ?? []).map(
        (ref: any) => ({
            node_id: ref.node_id ?? '',
            title: ref.title ?? ref.section ?? '',
            page_range: ref.page_range ?? [ref.start_page ?? 0, ref.end_page ?? 0],
            reasoning: ref.reasoning ?? ref.relevance ?? '',
            content: ref.content ?? ref.text ?? '',
        })
    );

    return { answer: content, traces };
}

/**
 * Check if PageIndex is configured (API key is set).
 */
export function isPageIndexAvailable(): boolean {
    return !!process.env.PAGEINDEX_API_KEY;
}
