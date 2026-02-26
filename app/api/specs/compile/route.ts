import { NextRequest, NextResponse } from 'next/server';

const SYSTEM_PROMPT = `You are a Product Requirements Analyst. Transform raw context into structured Executable Specifications. Output valid JSON only.`;

// Mock response for demo when Cloudflare auth fails
function generateMockSpec(context: string) {
  const hasBulkDelete = context.toLowerCase().includes('bulk') || context.toLowerCase().includes('delete');
  const hasExport = context.toLowerCase().includes('export') || context.toLowerCase().includes('json');
  
  return {
    narrative: {
      title: hasBulkDelete ? "Bulk Document Deletion" : hasExport ? "Multi-Format Export" : "Feature Implementation",
      objective: hasBulkDelete 
        ? "Enable users to delete multiple documents at once for workflow efficiency"
        : "Implement the requested feature based on customer feedback",
      rationale: "Multiple customer requests and enterprise demand justify this feature"
    },
    contextPointers: [
      { source: "Slack #product-feedback", snippet: "Customers have been asking for this feature", link: null },
      { source: "GitHub Issue", snippet: "Feature request with high priority label", link: null },
      { source: "Customer Interview", snippet: "This is blocking our workflow", link: null }
    ],
    constraints: [
      { 
        rule: hasBulkDelete 
          ? "DO NOT bypass permission checks - validate user permissions for EACH item"
          : "DO NOT break backward compatibility with existing functionality",
        severity: "critical", 
        rationale: "Security and data integrity must be maintained" 
      },
      { 
        rule: "Implement soft-delete with recovery window before permanent deletion", 
        severity: "warning", 
        rationale: "Enterprise customers need audit trails" 
      },
      { 
        rule: "Add rate limiting to prevent abuse", 
        severity: "info", 
        rationale: "Performance protection" 
      }
    ],
    verification: [
      {
        scenario: "User performs action with valid permissions",
        given: ["User has required permissions", "User is authenticated"],
        when: ["User initiates the action", "System processes request"],
        then: ["Action completes successfully", "User sees confirmation"]
      },
      {
        scenario: "User attempts action without permission",
        given: ["User lacks required permissions"],
        when: ["User attempts the action"],
        then: ["Action is blocked", "User sees permission denied error"]
      }
    ]
  };
}

export async function POST(request: NextRequest) {
  try {
    const { context } = await request.json();

    if (!context || typeof context !== 'string') {
      return NextResponse.json({ error: 'Context is required' }, { status: 400 });
    }

    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const apiToken = process.env.CLOUDFLARE_API_TOKEN;

    // Try Cloudflare first
    if (accountId && apiToken) {
      try {
        const response = await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/meta/llama-3.1-8b-instruct`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: `Generate JSON spec for:\n\n${context}` }
              ],
              max_tokens: 2048,
            }),
          }
        );

        const data = await response.json();
        
        if (data.success && data.result?.response) {
          let jsonText = data.result.response.trim();
          if (jsonText.startsWith('```')) jsonText = jsonText.replace(/```json?\n?/g, '').replace(/```$/g, '');
          const spec = JSON.parse(jsonText);
          return NextResponse.json({ spec, source: 'cloudflare' });
        }
      } catch (cfError) {
        console.log('Cloudflare failed, using mock:', cfError);
      }
    }

    // Fallback to mock for demo
    const spec = generateMockSpec(context);
    return NextResponse.json({ spec, source: 'mock' });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed' },
      { status: 500 }
    );
  }
}
