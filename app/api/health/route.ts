/**
 * GET /api/health
 *
 * System health endpoint — returns the operational status of all
 * critical subsystems: database, AI inference, and MCP server.
 *
 * Response shape:
 * {
 *   status:       'healthy'|'degraded'|'down',
 *   database:     { connected: boolean, latency_ms: number },
 *   ai_inference: { available: boolean, latency_ms: number },
 *   mcp_server:   { running: boolean },
 *   version:      string,
 *   uptime_seconds: number
 * }
 *
 * HTTP status codes:
 *   200 — healthy or degraded (service is responding)
 *   503 — down (critical services unavailable)
 */

import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAIClient, AI_MODEL } from '@/lib/ai';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/** Server start time for uptime calculation */
const SERVER_START = Date.now();

// ─── SUB-CHECKS ───────────────────────────────────────────────────────────────

async function checkDatabase(): Promise<{ connected: boolean; latency_ms: number }> {
  const t0 = Date.now();
  try {
    const sql = getDb();
    await sql`SELECT 1`;
    return { connected: true, latency_ms: Date.now() - t0 };
  } catch {
    return { connected: false, latency_ms: Date.now() - t0 };
  }
}

async function checkAiInference(): Promise<{ available: boolean; latency_ms: number }> {
  const t0 = Date.now();
  try {
    const client = getAIClient();
    // Minimal completion to test reachability
    await client.chat.completions.create({
      model: AI_MODEL,
      messages: [{ role: 'user', content: 'ping' }],
      max_tokens: 1,
    });
    return { available: true, latency_ms: Date.now() - t0 };
  } catch {
    return { available: false, latency_ms: Date.now() - t0 };
  }
}

async function checkMcpServer(): Promise<{ running: boolean }> {
  // MCP server is in-process (no separate TCP check needed for Phase 6).
  // We check whether the MCP module can be required without throwing.
  try {
    // Dynamic import avoids a hard dependency at module load time
    await import('@/lib/mcp-server');
    return { running: true };
  } catch {
    return { running: false };
  }
}

// ─── ROUTE HANDLER ────────────────────────────────────────────────────────────

export async function GET() {
  // Run all checks concurrently
  const [database, ai_inference, mcp_server] = await Promise.all([
    checkDatabase(),
    checkAiInference(),
    checkMcpServer(),
  ]);

  const uptime_seconds = Math.floor((Date.now() - SERVER_START) / 1000);
  const version = process.env.npm_package_version ?? '1.0.0';

  // Determine overall status
  let status: 'healthy' | 'degraded' | 'down';
  if (!database.connected) {
    status = 'down';       // DB is critical — no DB means down
  } else if (!ai_inference.available || !mcp_server.running) {
    status = 'degraded';   // Core features impacted but service is up
  } else {
    status = 'healthy';
  }

  const body = {
    status,
    database,
    ai_inference,
    mcp_server,
    version,
    uptime_seconds,
  };

  return NextResponse.json(body, {
    status: status === 'down' ? 503 : 200,
    headers: {
      'Cache-Control': 'no-store',
      'X-Health-Status': status,
    },
  });
}
