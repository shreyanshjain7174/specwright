import { NextRequest, NextResponse } from 'next/server';
import { getAIClient, AI_MODEL } from '@/lib/ai';
import { SIMULATION_PROMPT, AGENT_IDENTITY } from '@/lib/agent';

export async function POST(request: NextRequest) {
  try {
    const { spec } = await request.json();

    if (!spec) {
      return NextResponse.json({ error: 'Spec is required' }, { status: 400 });
    }

    const client = getAIClient();

    const response = await client.chat.completions.create({
      model: AI_MODEL,
      messages: [
        { role: 'system', content: SIMULATION_PROMPT },
        {
          role: 'user',
          content: `Run a pre-code simulation on this Executable Specification and find issues:\n\n${JSON.stringify(spec, null, 2)}`,
        },
      ],
      max_tokens: 4096,
      temperature: 0.4,
    });

    const raw = response.choices[0]?.message?.content?.trim();

    if (!raw) {
      return NextResponse.json(
        { error: 'Simulation returned empty response. Please try again.' },
        { status: 502 }
      );
    }

    // Parse JSON — strip markdown fences if present
    let jsonText = raw;
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```json?\n?/g, '').replace(/```$/g, '').trim();
    }

    let result;
    try {
      result = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('Failed to parse simulation response:', raw);
      return NextResponse.json(
        { error: 'Simulation returned invalid response. Please try again.' },
        { status: 502 }
      );
    }

    // Validate and normalize
    result.passed = result.passed ?? false;
    result.totalScenarios = result.totalScenarios ?? 0;
    result.passedScenarios = result.passedScenarios ?? 0;
    result.failedScenarios = result.failedScenarios ?? 0;
    result.failures = result.failures ?? [];
    result.suggestions = result.suggestions ?? [];

    return NextResponse.json({
      result,
      agent: AGENT_IDENTITY.name,
      model: AI_MODEL,
    });
  } catch (error: any) {
    console.error('Simulation error:', error);

    if (error?.message?.includes('CLOUDFLARE_API_KEY')) {
      return NextResponse.json(
        { error: 'AI service not configured. Set CLOUDFLARE_API_KEY environment variable.' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to run simulation' },
      { status: 500 }
    );
  }
}
