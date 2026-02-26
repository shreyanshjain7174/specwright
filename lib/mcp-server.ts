/**
 * MCP Server module stub for health check resolution.
 * The actual MCP server runs via `src/index.ts` (npm run mcp).
 * This stub allows the health endpoint to detect MCP availability.
 */

export const MCP_SERVER_VERSION = '1.0.0';
export const MCP_TRANSPORT_MODES = ['stdio', 'http'] as const;
export type McpTransportMode = typeof MCP_TRANSPORT_MODES[number];

export function getMcpServerInfo() {
  return {
    version: MCP_SERVER_VERSION,
    transports: MCP_TRANSPORT_MODES,
    tools: ['fetch_spec', 'ingest_context', 'generate_spec', 'list_features', 'get_constraints', 'run_simulation'],
  };
}
