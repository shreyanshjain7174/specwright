/**
 * Jira Connector
 *
 * Imports issues, epics, and comments from Jira using the REST API v3.
 * Requires API token + email + domain.
 */

import { ImportedItem, SyncResult, TestResult } from './types';

interface JiraCredentials {
    domain: string;
    email: string;
    token: string;
    project?: string;
}

function jiraAuth(creds: JiraCredentials): string {
    return Buffer.from(`${creds.email}:${creds.token}`).toString('base64');
}

async function jiraFetch(creds: JiraCredentials, path: string) {
    const url = `https://${creds.domain}/rest/api/3${path}`;
    const res = await fetch(url, {
        headers: {
            Authorization: `Basic ${jiraAuth(creds)}`,
            Accept: 'application/json',
        },
    });
    if (!res.ok) throw new Error(`Jira API ${res.status}: ${await res.text()}`);
    return res.json();
}

export async function testJiraConnection(creds: JiraCredentials): Promise<TestResult> {
    try {
        const data = await jiraFetch(creds, '/myself');
        return {
            success: true,
            message: `Connected as ${data.displayName} (${data.emailAddress})`,
            details: { user: data.displayName, email: data.emailAddress },
        };
    } catch (err) {
        return { success: false, message: err instanceof Error ? err.message : 'Connection failed' };
    }
}

export async function syncJira(creds: JiraCredentials): Promise<{ items: ImportedItem[]; result: SyncResult }> {
    const start = Date.now();
    const items: ImportedItem[] = [];
    const errors: string[] = [];

    try {
        const jql = creds.project
            ? `project = "${creds.project}" ORDER BY updated DESC`
            : 'ORDER BY updated DESC';

        const data = await jiraFetch(creds, `/search?jql=${encodeURIComponent(jql)}&maxResults=50&fields=summary,description,status,priority,comment,issuetype,labels`);

        for (const issue of (data.issues ?? [])) {
            const fields = issue.fields;
            const comments = fields.comment?.comments ?? [];

            // Build rich context from issue
            const parts = [
                `[${issue.key}] ${fields.summary}`,
                `Type: ${fields.issuetype?.name ?? 'Unknown'} | Status: ${fields.status?.name ?? 'Unknown'} | Priority: ${fields.priority?.name ?? 'Medium'}`,
            ];

            if (fields.labels?.length) {
                parts.push(`Labels: ${fields.labels.join(', ')}`);
            }

            if (fields.description) {
                // Jira v3 uses ADF — extract text nodes
                const desc = typeof fields.description === 'string'
                    ? fields.description
                    : extractAdfText(fields.description);
                parts.push(`\nDescription:\n${desc}`);
            }

            if (comments.length > 0) {
                parts.push('\nComments:');
                for (const c of comments.slice(-5)) {
                    const body = typeof c.body === 'string' ? c.body : extractAdfText(c.body);
                    parts.push(`  @${c.author?.displayName ?? 'unknown'}: ${body}`);
                }
            }

            items.push({
                sourceId: `jira-${issue.key}`,
                sourceType: 'jira',
                title: `${issue.key}: ${fields.summary}`,
                content: parts.join('\n'),
                metadata: {
                    key: issue.key,
                    status: fields.status?.name,
                    priority: fields.priority?.name,
                    type: fields.issuetype?.name,
                    labels: fields.labels ?? [],
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

/** Extract plain text from Jira ADF (Atlassian Document Format) */
function extractAdfText(adf: any): string {
    if (!adf || typeof adf !== 'object') return String(adf ?? '');
    if (adf.type === 'text') return adf.text ?? '';
    if (adf.content && Array.isArray(adf.content)) {
        return adf.content.map(extractAdfText).join('');
    }
    return '';
}
