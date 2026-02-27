/**
 * Confluence Connector
 *
 * Imports pages and spaces from Confluence using the REST API.
 * Requires API token + email + domain (same as Jira).
 */

import { ImportedItem, SyncResult, TestResult } from './types';

interface ConfluenceCredentials {
    domain: string;
    email: string;
    token: string;
    spaceKey?: string;
}

function confluenceAuth(creds: ConfluenceCredentials): string {
    return Buffer.from(`${creds.email}:${creds.token}`).toString('base64');
}

async function confluenceFetch(creds: ConfluenceCredentials, path: string) {
    const url = `https://${creds.domain}/wiki/rest/api${path}`;
    const res = await fetch(url, {
        headers: {
            Authorization: `Basic ${confluenceAuth(creds)}`,
            Accept: 'application/json',
        },
    });
    if (!res.ok) throw new Error(`Confluence API ${res.status}: ${await res.text()}`);
    return res.json();
}

export async function testConfluenceConnection(creds: ConfluenceCredentials): Promise<TestResult> {
    try {
        const data = await confluenceFetch(creds, '/space?limit=1');
        const spaceCount = data.size ?? data.results?.length ?? 0;
        return {
            success: true,
            message: `Connected — ${spaceCount} spaces accessible`,
            details: { spaceCount },
        };
    } catch (err) {
        return { success: false, message: err instanceof Error ? err.message : 'Connection failed' };
    }
}

export async function syncConfluence(creds: ConfluenceCredentials): Promise<{ items: ImportedItem[]; result: SyncResult }> {
    const start = Date.now();
    const items: ImportedItem[] = [];
    const errors: string[] = [];

    try {
        // Build CQL query
        let cql = 'type=page';
        if (creds.spaceKey) {
            cql += ` AND space="${creds.spaceKey}"`;
        }
        cql += ' ORDER BY lastModified DESC';

        const data = await confluenceFetch(
            creds,
            `/content/search?cql=${encodeURIComponent(cql)}&limit=30&expand=body.storage,version,space`
        );

        for (const page of (data.results ?? [])) {
            // Strip HTML tags from Confluence storage format
            const htmlContent = page.body?.storage?.value ?? '';
            const plainText = stripHtml(htmlContent);

            if (!plainText.trim()) continue;

            items.push({
                sourceId: `confluence-${page.id}`,
                sourceType: 'confluence',
                title: page.title ?? 'Untitled',
                content: `[Confluence: ${page.space?.name ?? 'Unknown Space'}]\n\n${page.title}\n\n${plainText}`,
                metadata: {
                    pageId: page.id,
                    spaceKey: page.space?.key,
                    spaceName: page.space?.name,
                    version: page.version?.number,
                    lastModified: page.version?.when,
                    url: page._links?.webui ? `https://${creds.domain}/wiki${page._links.webui}` : null,
                },
                importedAt: new Date().toISOString(),
            });
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

/** Simple HTML tag stripper for Confluence storage format */
function stripHtml(html: string): string {
    return html
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/(p|div|h[1-6]|li|tr)>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}
