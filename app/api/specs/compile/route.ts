import { NextRequest, NextResponse } from 'next/server';
import { getAIClient, AI_MODEL } from '@/lib/ai';
import { SPEC_COMPILATION_PROMPT, AGENT_IDENTITY } from '@/lib/agent';

export async function POST(request: NextRequest) {
  try {
    const { context } = await request.json();

    if (!context || typeof context !== 'string') {
      return NextResponse.json({ error: 'Context is required' }, { status: 400 });
    }

    if (context.trim().length < 20) {
      return NextResponse.json(
        { error: 'Please provide more context (at least a few sentences)' },
        { status: 400 }
      );
    }

    const client = getAIClient();

    const response = await client.chat.completions.create({
      model: AI_MODEL,
      messages: [
        { role: 'system', content: SPEC_COMPILATION_PROMPT },
        {
          role: 'user',
          content: `Analyze the following raw product context and generate an Executable Specification:\n\n${context}`,
        },
      ],
      max_tokens: 4096,
      temperature: 0.3,
    });

    const raw = response.choices[0]?.message?.content?.trim();

    if (!raw) {
      return NextResponse.json(
        { error: 'AI returned empty response. Please try again.' },
        { status: 502 }
      );
    }

    // Parse JSON — strip markdown fences if present
    let jsonText = raw;
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```json?\n?/g, '').replace(/```$/g, '').trim();
    }

    let spec;
    try {
      spec = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('Failed to parse AI response:', raw);
      return NextResponse.json(
        { error: 'AI returned invalid JSON. Please try again with clearer context.' },
        { status: 502 }
      );
    }

    // Validate required fields
    if (!spec.narrative || !spec.constraints || !spec.verification) {
      return NextResponse.json(
        { error: 'AI response missing required fields. Please try again.' },
        { status: 502 }
      );
    }

    return NextResponse.json({
      spec,
      agent: AGENT_IDENTITY.name,
      model: AI_MODEL,
    });
  } catch (error: any) {
    console.error('Spec compilation error:', error);

    if (error?.message?.includes('CLOUDFLARE_API_KEY')) {
      return NextResponse.json(
        { error: 'AI service not configured. Set CLOUDFLARE_API_KEY environment variable.' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to compile spec' },
      { status: 500 }
    );
  }
}
