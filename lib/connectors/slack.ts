/**
 * Slack Connector
 *
 * Imports messages and threads from Slack channels using the Web API.
 * Requires a Bot Token with channels:history and channels:read scopes.
 */

import { ImportedItem, SyncResult, TestResult } from './types';

const SLACK_API = 'https://slack.com/api';

interface SlackCredentials {
    token: string;
    channel?: string;
}

async function slackFetch(endpoint: string, token: string, params: Record<string, string> = {}) {
    const url = new URL(`${SLACK_API}/${endpoint}`);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

    const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
}

export async function testSlackConnection(creds: SlackCredentials): Promise<TestResult> {
    try {
        const data = await slackFetch('auth.test', creds.token);
        if (!data.ok) {
            return { success: false, message: `Slack auth failed: ${data.error}` };
        }
        return {
            success: true,
            message: `Connected as ${data.user} in ${data.team}`,
            details: { team: data.team, user: data.user, teamId: data.team_id },
        };
    } catch (err) {
        return { success: false, message: err instanceof Error ? err.message : 'Connection failed' };
    }
}

export async function syncSlack(creds: SlackCredentials): Promise<{ items: ImportedItem[]; result: SyncResult }> {
    const start = Date.now();
    const items: ImportedItem[] = [];
    const errors: string[] = [];

    try {
        // Get channels to import from
        let channels: string[] = [];
        if (creds.channel) {
            channels = [creds.channel];
        } else {
            const channelList = await slackFetch('conversations.list', creds.token, {
                types: 'public_channel,private_channel',
                limit: '100',
            });
            if (channelList.ok) {
                channels = channelList.channels
                    .filter((c: any) => c.is_member)
                    .map((c: any) => c.id);
            }
        }

        // Import recent messages from each channel
        for (const channelId of channels.slice(0, 10)) {
            try {
                const history = await slackFetch('conversations.history', creds.token, {
                    channel: channelId,
                    limit: '50',
                });

                if (!history.ok) {
                    errors.push(`Channel ${channelId}: ${history.error}`);
                    continue;
                }

                for (const msg of (history.messages ?? [])) {
                    if (!msg.text || msg.subtype === 'channel_join') continue;

                    // Get thread replies if this is a parent message
                    let threadContent = msg.text;
                    if (msg.reply_count && msg.reply_count > 0) {
                        try {
                            const thread = await slackFetch('conversations.replies', creds.token, {
                                channel: channelId,
                                ts: msg.ts,
                                limit: '20',
                            });
                            if (thread.ok && thread.messages?.length > 1) {
                                threadContent = thread.messages
                                    .map((m: any) => `${m.user ?? 'unknown'}: ${m.text}`)
                                    .join('\n');
                            }
                        } catch {
                            // Use parent message only
                        }
                    }

                    items.push({
                        sourceId: `slack-${channelId}-${msg.ts}`,
                        sourceType: 'slack',
                        title: `Slack thread ${msg.ts}`,
                        content: threadContent,
                        metadata: {
                            channel: channelId,
                            timestamp: msg.ts,
                            user: msg.user,
                            replyCount: msg.reply_count ?? 0,
                        },
                        importedAt: new Date().toISOString(),
                    });
                }
            } catch (err) {
                errors.push(`Channel ${channelId}: ${err instanceof Error ? err.message : 'Failed'}`);
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
