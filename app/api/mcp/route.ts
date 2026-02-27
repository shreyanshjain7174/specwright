/**
 * /api/mcp — Production MCP HTTP endpoint
 *
 * GET  /api/mcp — Returns MCP server manifest (tool list + schemas)
 * POST /api/mcp — Executes MCP tool calls in-process (no separate server needed)
 *
 * This replaces the old proxy approach. Tools run directly against Neon PostgreSQL.
 */

import { NextRequest, NextResponse } from 'next/server';
import { TOOL_DEFINITIONS, callTool } from '@/lib/mcp/tools';

const MANIFEST = {
  name: 'specwright-mcp-server',
  version: '1.0.0',
  description: 'Specwright MCP server — transforms context into executable specs for AI coding agents',
  protocol_version: '2024-11-05',
  capabilities: { tools: {} },
  tools: TOOL_DEFINITIONS,
};

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/**
 * GET /api/mcp — MCP manifest
 */
export async function GET() {
  return NextResponse.json(MANIFEST, { headers: CORS_HEADERS });
}

/**
 * POST /api/mcp — Call a tool
 *
 * Accepts:
 *   { "tool_name": "fetch_spec", "arguments": { "feature_name": "Dark Mode" } }
 *
 * Also supports MCP protocol format:
 *   { "method": "tools/call", "params": { "name": "fetch_spec", "arguments": { ... } } }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Support both custom format and MCP protocol format
    let toolName: string;
    let toolArgs: Record<string, unknown>;

    if (body.method === 'tools/call') {
      // MCP protocol format
      toolName = body.params?.name;
      toolArgs = body.params?.arguments || {};
    } else if (body.method === 'tools/list') {
      // MCP list tools
      return NextResponse.json({ tools: TOOL_DEFINITIONS }, { headers: CORS_HEADERS });
    } else {
      // Simple format
      toolName = body.tool_name || body.name;
      toolArgs = body.arguments || body.args || {};
    }

    if (!toolName) {
      return NextResponse.json(
        { error: 'tool_name is required. Available tools: ' + TOOL_DEFINITIONS.map((t) => t.name).join(', ') },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const result = await callTool(toolName, toolArgs);

    return NextResponse.json(result, {
      status: result.isError ? 400 : 200,
      headers: CORS_HEADERS,
    });
  } catch (error) {
    return NextResponse.json(
      { error: `MCP tool call failed: ${String(error)}` },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

/**
 * OPTIONS /api/mcp — CORS preflight
 */
export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: CORS_HEADERS });
}
