/**
 * /api/mcp — Next.js API route for MCP HTTP integration
 *
 * GET  /api/mcp  — Returns MCP server manifest (tool list)
 * POST /api/mcp  — Proxies MCP tool calls to the running MCP HTTP server on port 3001
 */

import { NextRequest, NextResponse } from 'next/server';

const MCP_SERVER_URL = process.env.MCP_SERVER_URL || 'http://localhost:3001';

const TOOL_MANIFEST = {
  name: 'specwright-mcp-server',
  version: '1.0.0',
  description: 'Specwright MCP server — transforms context into executable specs for AI coding agents',
  tools: [
    { name: 'fetch_spec', description: 'Retrieve a complete Executable Specification by feature name or ID' },
    { name: 'ingest_context', description: 'Ingest raw context (Slack thread, Jira ticket, meeting transcript) linked to a feature' },
    { name: 'generate_spec', description: 'Trigger full spec generation pipeline for a feature' },
    { name: 'list_features', description: 'List all features, optionally filtered by status' },
    { name: 'get_constraints', description: 'Get DO NOT constraint rules for a specific feature' },
    { name: 'run_simulation', description: 'Run pre-code simulation against a spec (4 validators)' },
  ],
};

export async function GET(_req: NextRequest) {
  return NextResponse.json(TOOL_MANIFEST, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const upstream = await fetch(`${MCP_SERVER_URL}/mcp/call`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!upstream.ok) {
      const text = await upstream.text();
      return NextResponse.json({ error: `MCP server error: ${text}` }, { status: upstream.status });
    }

    const result = await upstream.json();
    return NextResponse.json(result, { headers: { 'Access-Control-Allow-Origin': '*' } });
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return NextResponse.json(
        { error: 'MCP server not running', hint: 'Start with: MCP_SERVER_MODE=http MCP_HTTP_PORT=3001 npm run mcp', url: `${MCP_SERVER_URL}/mcp/call` },
        { status: 503 },
      );
    }
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function OPTIONS(_req: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
