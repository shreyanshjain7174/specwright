import { NextRequest, NextResponse } from 'next/server';

const SYSTEM_PROMPT = `You are a Virtual User Simulator. Test an Executable Specification mentally. Output valid JSON only.`;

// Mock simulation for demo
function generateMockSimulation(spec: any) {
  const hasSecurityConstraint = spec.constraints?.some((c: any) => 
    c.rule?.toLowerCase().includes('permission') || c.severity === 'critical'
  );
  
  return {
    passed: false,
    totalScenarios: spec.verification?.length || 2,
    passedScenarios: (spec.verification?.length || 2) - 1,
    failedScenarios: 1,
    failures: [
      {
        scenario: "Edge case: concurrent operations",
        reason: hasSecurityConstraint 
          ? "CRITICAL: Spec mentions permission checks but does not specify handling for concurrent bulk operations. Race condition could bypass permission validation."
          : "Spec does not define behavior when multiple users perform the action simultaneously."
      }
    ],
    suggestions: [
      "Add constraint: Implement distributed locking for bulk operations",
      "Add verification scenario for concurrent access patterns",
      "Consider adding audit logging for compliance requirements"
    ]
  };
}

export async function POST(request: NextRequest) {
  try {
    const { spec } = await request.json();
    if (!spec) {
      return NextResponse.json({ error: 'Spec is required' }, { status: 400 });
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
                { role: 'user', content: `Simulate:\n\n${JSON.stringify(spec, null, 2)}` }
              ],
              max_tokens: 1024,
            }),
          }
        );

        const data = await response.json();
        
        if (data.success && data.result?.response) {
          let jsonText = data.result.response.trim();
          if (jsonText.startsWith('```')) jsonText = jsonText.replace(/```json?\n?/g, '').replace(/```$/g, '');
          const result = JSON.parse(jsonText);
          return NextResponse.json({ result, source: 'cloudflare' });
        }
      } catch (cfError) {
        console.log('Cloudflare failed, using mock:', cfError);
      }
    }

    // Fallback to mock for demo
    const result = generateMockSimulation(spec);
    return NextResponse.json({ result, source: 'mock' });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed' },
      { status: 500 }
    );
  }
}
