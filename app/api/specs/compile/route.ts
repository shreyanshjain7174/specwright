import { NextRequest, NextResponse } from 'next/server';
import { getAIClient, AI_MODEL } from '@/lib/ai';
import { SPEC_COMPILATION_PROMPT, AGENT_IDENTITY } from '@/lib/agent';
import { retrieveContext, mergeRetrievalResults } from '@/lib/retrieval-router';

export async function POST(request: NextRequest) {
  try {
    const { context, documentIds } = await request.json();

    if (!context || typeof context !== 'string') {
      return NextResponse.json({ error: 'Context is required' }, { status: 400 });
    }

    if (context.trim().length < 20) {
      return NextResponse.json(
        { error: 'Please provide more context (at least a few sentences)' },
        { status: 400 }
      );
    }

    // Hybrid retrieval: direct context + optional PageIndex docs
    const retrievalResults = await retrieveContext({
      rawContext: context,
      documentIds,
    });

    const mergedContext = mergeRetrievalResults(retrievalResults);

    // Build retrieval sources metadata for the frontend
    const retrievalSources = retrievalResults.map((r) => ({
      method: r.method,
      source: r.source,
      traces: r.traces,
    }));

    const client = getAIClient();

    const response = await client.chat.completions.create({
      model: AI_MODEL,
      messages: [
        { role: 'system', content: SPEC_COMPILATION_PROMPT },
        {
          role: 'user',
          content: `Analyze the following raw product context and generate an Executable Specification:\n\n${mergedContext}`,
        },
      ],
      max_tokens: 4096,
      temperature: 0.3,
    });

    const rawContent: any = response.choices[0]?.message?.content;

    // Cloudflare Workers AI may return content as a string, array of parts, or object
    let raw: string | undefined;
    if (typeof rawContent === 'string') {
      raw = rawContent.trim();
    } else if (Array.isArray(rawContent)) {
      raw = rawContent
        .map((part: any) => (typeof part === 'string' ? part : part?.text ?? ''))
        .join('')
        .trim();
    } else if (rawContent && typeof rawContent === 'object') {
      raw = JSON.stringify(rawContent);
    }

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
      retrievalSources,
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
