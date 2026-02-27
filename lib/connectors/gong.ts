/**
 * Gong Connector
 *
 * Imports call transcripts from Gong using the API v2.
 * Requires access key + secret key.
 */

import { ImportedItem, SyncResult, TestResult } from './types';

const GONG_API = 'https://api.gong.io/v2';

interface GongCredentials {
    accessKey: string;
    secretKey: string;
}

function gongAuth(creds: GongCredentials): string {
    return Buffer.from(`${creds.accessKey}:${creds.secretKey}`).toString('base64');
}

async function gongFetch(creds: GongCredentials, path: string, body?: any) {
    const res = await fetch(`${GONG_API}${path}`, {
        method: body ? 'POST' : 'GET',
        headers: {
            Authorization: `Basic ${gongAuth(creds)}`,
            'Content-Type': 'application/json',
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
    });
    if (!res.ok) throw new Error(`Gong API ${res.status}: ${await res.text()}`);
    return res.json();
}

export async function testGongConnection(creds: GongCredentials): Promise<TestResult> {
    try {
        const data = await gongFetch(creds, '/users');
        return {
            success: true,
            message: `Connected — ${data.users?.length ?? 0} users found`,
            details: { userCount: data.users?.length ?? 0 },
        };
    } catch (err) {
        return { success: false, message: err instanceof Error ? err.message : 'Connection failed' };
    }
}

export async function syncGong(creds: GongCredentials): Promise<{ items: ImportedItem[]; result: SyncResult }> {
    const start = Date.now();
    const items: ImportedItem[] = [];
    const errors: string[] = [];

    try {
        // Get recent calls (last 30 days)
        const fromDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const callsData = await gongFetch(creds, '/calls', {
            filter: {
                fromDateTime: fromDate,
            },
            contentSelector: {
                exposedFields: { content: true },
            },
        });

        const callIds = (callsData.calls ?? []).map((c: any) => c.id).slice(0, 20);

        if (callIds.length > 0) {
            // Get transcripts for calls
            const transcripts = await gongFetch(creds, '/calls/transcript', {
                filter: { callIds },
            });

            for (const transcript of (transcripts.callTranscripts ?? [])) {
                const callInfo = (callsData.calls ?? []).find((c: any) => c.id === transcript.callId);

                // Build readable transcript
                const parts = [];
                if (callInfo) {
                    parts.push(`Call: ${callInfo.title ?? 'Untitled'}`);
                    parts.push(`Date: ${callInfo.started ?? 'Unknown'}`);
                    parts.push(`Duration: ${Math.round((callInfo.duration ?? 0) / 60)} min`);
                    if (callInfo.parties?.length) {
                        parts.push(`Participants: ${callInfo.parties.map((p: any) => p.name ?? p.emailAddress).join(', ')}`);
                    }
                    parts.push('');
                }

                for (const sentence of (transcript.transcript ?? [])) {
                    const speaker = sentence.speakerName ?? sentence.speakerId ?? 'Unknown';
                    parts.push(`[${speaker}]: ${sentence.text ?? ''}`);
                }

                items.push({
                    sourceId: `gong-${transcript.callId}`,
                    sourceType: 'gong',
                    title: callInfo?.title ?? `Gong Call ${transcript.callId}`,
                    content: parts.join('\n'),
                    metadata: {
                        callId: transcript.callId,
                        duration: callInfo?.duration,
                        parties: callInfo?.parties?.map((p: any) => p.name),
                        date: callInfo?.started,
                    },
                    importedAt: new Date().toISOString(),
                });
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
