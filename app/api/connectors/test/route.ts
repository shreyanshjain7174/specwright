import { NextRequest, NextResponse } from 'next/server';
import { testSlackConnection } from '@/lib/connectors/slack';
import { testJiraConnection } from '@/lib/connectors/jira';
import { testNotionConnection } from '@/lib/connectors/notion';
import { testGongConnection } from '@/lib/connectors/gong';
import { testConfluenceConnection } from '@/lib/connectors/confluence';
import { ConnectorType } from '@/lib/connectors/types';

export async function POST(request: NextRequest) {
    try {
        const { type, credentials } = await request.json();

        if (!type || !credentials) {
            return NextResponse.json(
                { error: 'type and credentials are required' },
                { status: 400 }
            );
        }

        let result;
        switch (type as ConnectorType) {
            case 'slack':
                result = await testSlackConnection(credentials);
                break;
            case 'jira':
                result = await testJiraConnection(credentials);
                break;
            case 'notion':
                result = await testNotionConnection(credentials);
                break;
            case 'gong':
                result = await testGongConnection(credentials);
                break;
            case 'confluence':
                result = await testConfluenceConnection(credentials);
                break;
            default:
                return NextResponse.json(
                    { error: `Unknown connector type: ${type}` },
                    { status: 400 }
                );
        }

        return NextResponse.json(result);
    } catch (error) {
        return NextResponse.json(
            { success: false, message: error instanceof Error ? error.message : 'Test failed' },
            { status: 500 }
        );
    }
}
