/**
 * POST /api/specs/generate
 *
 * Streaming spec generation via the multi-agent orchestrator.
 * Uses Server-Sent Events (SSE) to stream progress updates to the client
 * while the agents run sequentially.
 *
 * Body:
 *   featureName   - Name/description of the feature to generate a spec for
 *   featureId     - (optional) Link to an existing feature in the DB
 *   rawContext    - (optional) Raw context string to include
 *   orgId         - (optional) Organisation ID
 *   stream        - (optional) If false, return JSON directly (default: true)
 *
 * Response (streaming):
 *   SSE events: { type: 'progress'|'result'|'error', data: {...} }
 */

import { NextRequest, NextResponse } from 'next/server';
import { runOrchestrator, persistSpec } from '@/lib/agents/orchestrator';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const {
    featureName,
    featureId = null,
    rawContext,
    orgId = null,
    stream = true,
  } = body;

  if (!featureName) {
    return NextResponse.json({ error: 'featureName is required' }, { status: 400 });
  }

  // ── Non-streaming mode ──────────────────────────────────────────────────
  if (!stream) {
    try {
      const result = await runOrchestrator({ featureName, featureId, rawContext, orgId });
      const specId = await persistSpec(result, featureId, orgId);
      return NextResponse.json({ specId, ...result });
    } catch (error) {
      console.error('[/api/specs/generate] Error:', error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Spec generation failed' },
        { status: 500 },
      );
    }
  }

  // ── Streaming mode via SSE ─────────────────────────────────────────────
  const encoder = new TextEncoder();
  let controller!: ReadableStreamDefaultController<Uint8Array>;

  const readable = new ReadableStream<Uint8Array>({
    start(c) { controller = c; },
  });

  /** Send an SSE event to the client */
  function send(type: string, data: unknown) {
    const msg = `data: ${JSON.stringify({ type, data })}\n\n`;
    controller.enqueue(encoder.encode(msg));
  }

  // Run orchestrator in the background
  (async () => {
    try {
      send('start', { featureName, message: 'Starting spec generation...' });

      const result = await runOrchestrator(
        { featureName, featureId, rawContext, orgId },
        (step) => {
          send('progress', {
            stepName: step.stepName,
            agentName: step.agentName,
            status: step.status,
            message: step.message,
          });
        },
      );

      // Persist to DB
      const specId = await persistSpec(result, featureId, orgId);

      send('result', {
        specId,
        spec: result.spec,
        review: result.review,
        approved: result.approved,
        steps: result.steps,
        auditLogIds: result.auditLogIds,
      });
    } catch (error) {
      console.error('[/api/specs/generate] Streaming error:', error);
      send('error', {
        message: error instanceof Error ? error.message : 'Spec generation failed',
      });
    } finally {
      controller.close();
    }
  })();

  return new NextResponse(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
