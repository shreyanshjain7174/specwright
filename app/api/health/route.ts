/**
 * /api/health — Production health check
 *
 * Returns structured JSON with service status for monitoring.
 */

import { NextResponse } from 'next/server';
import { TOOL_DEFINITIONS } from '@/lib/mcp/tools';

export async function GET() {
  const checks: Record<string, { status: string; latency_ms?: number; error?: string }> = {};

  // Database check
  const dbStart = Date.now();
  try {
    const { getDb } = await import('@/lib/db');
    const sql = getDb();
    await sql`SELECT 1 as ping`;
    checks.database = { status: 'ok', latency_ms: Date.now() - dbStart };
  } catch (error) {
    checks.database = { status: 'error', latency_ms: Date.now() - dbStart, error: String(error) };
  }

  // Cloudflare AI check
  checks.ai = {
    status: process.env.CLOUDFLARE_API_KEY ? 'configured' : 'missing',
  };

  // PageIndex check
  checks.pageindex = {
    status: process.env.PAGEINDEX_API_KEY ? 'configured' : 'not_configured',
  };

  // MCP tools
  checks.mcp = {
    status: 'ok',
  };

  const allOk = Object.values(checks).every((c) => c.status !== 'error');

  return NextResponse.json(
    {
      status: allOk ? 'healthy' : 'degraded',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      services: checks,
      mcp_tools: TOOL_DEFINITIONS.map((t) => t.name),
    },
    {
      status: allOk ? 200 : 503,
      headers: { 'Cache-Control': 'no-store' },
    }
  );
}
