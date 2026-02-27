/**
 * Notion Connector
 *
 * Imports pages and database items from Notion using the API.
 * Requires an internal integration token.
 */

import { ImportedItem, SyncResult, TestResult } from './types';

const NOTION_API = 'https://api.notion.com/v1';
const NOTION_VERSION = '2022-06-28';

interface NotionCredentials {
    token: string;
    databaseId?: string;
}

async function notionFetch(path: string, token: string, body?: any) {
    const res = await fetch(`${NOTION_API}${path}`, {
        method: body ? 'POST' : 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
            'Notion-Version': NOTION_VERSION,
            'Content-Type': 'application/json',
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
    });
    if (!res.ok) throw new Error(`Notion API ${res.status}: ${await res.text()}`);
    return res.json();
}

export async function testNotionConnection(creds: NotionCredentials): Promise<TestResult> {
    try {
        const data = await notionFetch('/users/me', creds.token);
        return {
            success: true,
            message: `Connected as ${data.name ?? data.type} integration`,
            details: { name: data.name, type: data.type, id: data.id },
        };
    } catch (err) {
        return { success: false, message: err instanceof Error ? err.message : 'Connection failed' };
    }
}

export async function syncNotion(creds: NotionCredentials): Promise<{ items: ImportedItem[]; result: SyncResult }> {
    const start = Date.now();
    const items: ImportedItem[] = [];
    const errors: string[] = [];

    try {
        if (creds.databaseId) {
            // Import from specific database
            const data = await notionFetch(`/databases/${creds.databaseId}/query`, creds.token, {
                page_size: 50,
            });

            for (const page of (data.results ?? [])) {
                const content = await getPageContent(page.id, creds.token);
                const title = extractNotionTitle(page);

                items.push({
                    sourceId: `notion-${page.id}`,
                    sourceType: 'notion',
                    title,
                    content,
                    metadata: {
                        pageId: page.id,
                        url: page.url,
                        createdTime: page.created_time,
                        lastEdited: page.last_edited_time,
                    },
                    importedAt: new Date().toISOString(),
                });
            }
        } else {
            // Search for recent pages
            const data = await notionFetch('/search', creds.token, {
                sort: { direction: 'descending', timestamp: 'last_edited_time' },
                page_size: 30,
            });

            for (const page of (data.results ?? []).filter((r: any) => r.object === 'page')) {
                try {
                    const content = await getPageContent(page.id, creds.token);
                    const title = extractNotionTitle(page);

                    items.push({
                        sourceId: `notion-${page.id}`,
                        sourceType: 'notion',
                        title,
                        content,
                        metadata: {
                            pageId: page.id,
                            url: page.url,
                            lastEdited: page.last_edited_time,
                        },
                        importedAt: new Date().toISOString(),
                    });
                } catch (err) {
                    errors.push(`Page ${page.id}: ${err instanceof Error ? err.message : 'Failed'}`);
                }
            }
        }
    } catch (err) {
        errors.push(err instanceof Error ? err.message : 'Sync failed');
    }

    return {
        items,
        result: {
            success: errors.length === 0,
            itemsImported: items.length,
            errors,
            duration: Date.now() - start,
        },
    };
}

async function getPageContent(pageId: string, token: string): Promise<string> {
    const data = await notionFetch(`/blocks/${pageId}/children?page_size=100`, token);
    return (data.results ?? []).map(extractBlockText).filter(Boolean).join('\n');
}

function extractBlockText(block: any): string {
    const richText = block[block.type]?.rich_text;
    if (richText) {
        return richText.map((t: any) => t.plain_text ?? '').join('');
    }
    if (block.type === 'child_page') return `[Subpage: ${block.child_page?.title ?? 'Untitled'}]`;
    if (block.type === 'divider') return '---';
    return '';
}

function extractNotionTitle(page: any): string {
    const props = page.properties ?? {};
    for (const prop of Object.values(props) as any[]) {
        if (prop.type === 'title' && prop.title?.length > 0) {
            return prop.title.map((t: any) => t.plain_text ?? '').join('');
        }
    }
    return 'Untitled';
}
