/**
 * Connector Framework — Shared Types
 *
 * Defines the interface for all Specwright data source connectors.
 */

export type ConnectorType = 'slack' | 'jira' | 'notion' | 'gong' | 'confluence';

export interface ConnectorConfig {
    id?: number;
    type: ConnectorType;
    name: string;
    credentials: Record<string, string>;
    settings?: Record<string, any>;
    status: 'disconnected' | 'connected' | 'syncing' | 'error';
    lastSyncAt?: string;
    itemsSynced?: number;
    createdAt?: string;
}

export interface ImportedItem {
    sourceId: string;
    sourceType: ConnectorType;
    title: string;
    content: string;
    metadata: Record<string, any>;
    importedAt: string;
}

export interface SyncResult {
    success: boolean;
    itemsImported: number;
    errors: string[];
    duration: number;
}

export interface TestResult {
    success: boolean;
    message: string;
    details?: Record<string, any>;
}

/** Connector metadata for UI display */
export interface ConnectorMeta {
    type: ConnectorType;
    name: string;
    description: string;
    icon: string;
    color: string;
    fields: ConnectorField[];
}

export interface ConnectorField {
    key: string;
    label: string;
    type: 'text' | 'password' | 'url';
    placeholder: string;
    required: boolean;
    helpText?: string;
}

/** Registry of all available connectors */
export const CONNECTOR_REGISTRY: ConnectorMeta[] = [
    {
        type: 'slack',
        name: 'Slack',
        description: 'Import threads, channels, and conversations',
        icon: '💬',
        color: 'purple',
        fields: [
            { key: 'token', label: 'Bot Token', type: 'password', placeholder: 'xoxb-...', required: true, helpText: 'Slack Bot User OAuth Token with channels:history, channels:read scopes' },
            { key: 'channel', label: 'Channel ID', type: 'text', placeholder: 'C01234ABCDE', required: false, helpText: 'Leave blank to import from all accessible channels' },
        ],
    },
    {
        type: 'jira',
        name: 'Jira',
        description: 'Import issues, epics, and comments',
        icon: '🎫',
        color: 'blue',
        fields: [
            { key: 'domain', label: 'Jira Domain', type: 'url', placeholder: 'your-org.atlassian.net', required: true },
            { key: 'email', label: 'Email', type: 'text', placeholder: 'you@company.com', required: true },
            { key: 'token', label: 'API Token', type: 'password', placeholder: 'Your Jira API token', required: true, helpText: 'Generate at id.atlassian.com/manage-profile/security/api-tokens' },
            { key: 'project', label: 'Project Key', type: 'text', placeholder: 'PROJ', required: false, helpText: 'Leave blank for all projects' },
        ],
    },
    {
        type: 'notion',
        name: 'Notion',
        description: 'Import pages, databases, and wikis',
        icon: '📝',
        color: 'slate',
        fields: [
            { key: 'token', label: 'Integration Token', type: 'password', placeholder: 'secret_...', required: true, helpText: 'Create an internal integration at notion.so/my-integrations' },
            { key: 'databaseId', label: 'Database ID', type: 'text', placeholder: 'Optional — specific database to import', required: false },
        ],
    },
    {
        type: 'gong',
        name: 'Gong',
        description: 'Import call transcripts and insights',
        icon: '📞',
        color: 'amber',
        fields: [
            { key: 'accessKey', label: 'Access Key', type: 'password', placeholder: 'Your Gong access key', required: true },
            { key: 'secretKey', label: 'Secret Key', type: 'password', placeholder: 'Your Gong secret key', required: true, helpText: 'Generate at app.gong.io/company/api' },
        ],
    },
    {
        type: 'confluence',
        name: 'Confluence',
        description: 'Import pages, spaces, and documentation',
        icon: '📚',
        color: 'cyan',
        fields: [
            { key: 'domain', label: 'Confluence Domain', type: 'url', placeholder: 'your-org.atlassian.net', required: true },
            { key: 'email', label: 'Email', type: 'text', placeholder: 'you@company.com', required: true },
            { key: 'token', label: 'API Token', type: 'password', placeholder: 'Your Confluence API token', required: true },
            { key: 'spaceKey', label: 'Space Key', type: 'text', placeholder: 'PROD', required: false, helpText: 'Leave blank for all spaces' },
        ],
    },
];
