/**
 * Specwright MCP Server
 * 
 * Dual-transport implementation supporting:
 * - STDIO (for Claude Desktop, CLI)
 * - HTTP (for Cursor web integration)
 * 
 * Run with:
 * - STDIO: npm run mcp
 * - HTTP: MCP_SERVER_MODE=http npm run mcp
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
    CallToolRequestSchema,
    ErrorCode,
    ListToolsRequestSchema,
    McpError,
} from '@modelcontextprotocol/sdk/types.js';
import crypto from 'crypto';
import { memgraphClient, setupMemgraph } from './db/memgraph.js';
import { qdrantClient, setupQdrant } from './db/qdrant.js';
import http from 'http';

/**
 * MCP Tool Definitions
 * All 6 tools required for production Specwright integration
 */
interface ToolDefinition {
    name: string;
    description: string;
    inputSchema: Record<string, unknown>;
}

class SpecwrightMCPServer {
    private server: Server;
    private tools: ToolDefinition[] = [
        {
            name: 'fetch_spec',
            description: 'Retrieve a complete Executable Specification by feature name or ID',
            inputSchema: {
                type: 'object',
                properties: {
                    feature_name: {
                        type: 'string',
                        description: 'Feature name or ID',
                    },
                },
                required: ['feature_name'],
            },
        },
        {
            name: 'ingest_context',
            description: 'Ingest raw context (Slack thread, Jira ticket, meeting transcript) linked to a feature',
            inputSchema: {
                type: 'object',
                properties: {
                    source_type: {
                        type: 'string',
                        enum: ['slack', 'jira', 'notion', 'github', 'transcript', 'manual'],
                        description: 'Source type of the context',
                    },
                    content: {
                        type: 'string',
                        description: 'Raw text content to ingest',
                    },
                    feature_name: {
                        type: 'string',
                        description: 'Feature this context belongs to',
                    },
                    source_url: {
                        type: 'string',
                        description: 'Optional URL/reference to original source',
                    },
                },
                required: ['source_type', 'content', 'feature_name'],
            },
        },
        {
            name: 'generate_spec',
            description: 'Generate an Executable Specification from a feature description or raw input',
            inputSchema: {
                type: 'object',
                properties: {
                    feature_name: {
                        type: 'string',
                        description: 'Feature to generate spec for',
                    },
                    description: {
                        type: 'string',
                        description: 'Optional detailed description (will be analyzed alongside ingested context)',
                    },
                },
                required: ['feature_name'],
            },
        },
        {
            name: 'list_features',
            description: 'List all features with their spec status (draft, simulated, approved)',
            inputSchema: {
                type: 'object',
                properties: {
                    search: {
                        type: 'string',
                        description: 'Optional search term to filter features',
                    },
                    status: {
                        type: 'string',
                        enum: ['draft', 'simulated', 'approved'],
                        description: 'Optional status filter',
                    },
                },
                required: [],
            },
        },
        {
            name: 'get_constraints',
            description: 'Retrieve only the Constraint Layer (DO NOT rules) for a feature — quick reference during coding',
            inputSchema: {
                type: 'object',
                properties: {
                    feature_name: {
                        type: 'string',
                        description: 'Feature to get constraints for',
                    },
                },
                required: ['feature_name'],
            },
        },
        {
            name: 'run_simulation',
            description: 'Run pre-code simulation on a spec to catch errors before implementation',
            inputSchema: {
                type: 'object',
                properties: {
                    spec_id: {
                        type: 'string',
                        description: 'Spec ID to simulate',
                    },
                },
                required: ['spec_id'],
            },
        },
    ];

    constructor() {
        this.server = new Server(
            {
                name: 'specwright-mcp-server',
                version: '1.0.0',
            },
            {
                capabilities: {
                    tools: {},
                },
            }
        );

        this.setupToolHandlers();

        // Error handling
        this.server.onerror = (error) => {
            console.error('[MCP Error]', error);
        };

        process.on('SIGINT', async () => {
            await this.shutdown();
        });
    }

    /**
     * Setup MCP request handlers for all tools
     */
    private setupToolHandlers() {
        this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
            tools: this.tools,
        }));

        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            try {
                switch (request.params.name) {
                    case 'fetch_spec':
                        return await this.handleFetchSpec(request.params.arguments);
                    case 'ingest_context':
                        return await this.handleIngestContext(request.params.arguments);
                    case 'generate_spec':
                        return await this.handleGenerateSpec(request.params.arguments);
                    case 'list_features':
                        return await this.handleListFeatures(request.params.arguments);
                    case 'get_constraints':
                        return await this.handleGetConstraints(request.params.arguments);
                    case 'run_simulation':
                        return await this.handleRunSimulation(request.params.arguments);
                    default:
                        throw new McpError(
                            ErrorCode.MethodNotFound,
                            `Unknown tool: ${request.params.name}`
                        );
                }
            } catch (error) {
                console.error(`[Tool Error] ${request.params.name}:`, error);
                throw error;
            }
        });
    }

    /**
     * Tool 1: fetch_spec
     * Retrieve complete 4-layer spec for a feature
     */
    private async handleFetchSpec(args: any) {
        if (!args.feature_name) {
            throw new McpError(ErrorCode.InvalidParams, 'feature_name is required');
        }

        const session = memgraphClient.session();
        try {
            const query = `
                MATCH (f:Feature {name: $featureName})
                OPTIONAL MATCH (f)-[:HAS_SPEC]->(s:Spec)
                OPTIONAL MATCH (s)-[:CITES]->(ctx:Context)
                RETURN {
                    feature_id: f.id,
                    feature_name: f.name,
                    spec: {
                        id: s.id,
                        version: s.version,
                        status: s.status,
                        narrative: s.narrative,
                        context_pointers: s.context_pointers,
                        constraints: s.constraints,
                        gherkin_tests: s.gherkin_tests,
                        simulation_result: s.simulation_result
                    },
                    context_citations: collect({
                        id: ctx.id,
                        source_type: ctx.source_type,
                        quote: ctx.quote,
                        url: ctx.url
                    })
                } as result
            `;

            const result = await session.run(query, { featureName: args.feature_name });

            if (result.records.length === 0) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(
                                { error: 'Feature or spec not found', feature: args.feature_name },
                                null,
                                2
                            ),
                        },
                    ],
                };
            }

            const record = result.records[0].get('result');
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(record, null, 2),
                    },
                ],
            };
        } catch (error) {
            throw new McpError(ErrorCode.InternalError, `Failed to fetch spec: ${String(error)}`);
        } finally {
            await session.close();
        }
    }

    /**
     * Tool 2: ingest_context
     * Ingest raw input (Slack, Jira, transcript, etc.) and link to feature
     */
    private async handleIngestContext(args: any) {
        if (!args.source_type || !args.content || !args.feature_name) {
            throw new McpError(
                ErrorCode.InvalidParams,
                'source_type, content, and feature_name are required'
            );
        }

        const contextId = crypto.randomUUID();
        const embedding = this.generateMockEmbedding(args.content);

        try {
            // Store in Qdrant (vector search)
            await qdrantClient.upsert('product_context', {
                wait: true,
                points: [
                    {
                        id: contextId,
                        vector: embedding,
                        payload: {
                            source_type: args.source_type,
                            content: args.content,
                            feature_name: args.feature_name,
                            source_url: args.source_url || null,
                            ingested_at: new Date().toISOString(),
                        },
                    },
                ],
            });

            // Link in graph (Memgraph)
            const session = memgraphClient.session();
            try {
                const query = `
                    MERGE (f:Feature {name: $featureName})
                    CREATE (c:Context {
                        id: $contextId,
                        source_type: $sourceType,
                        content: $content,
                        url: $sourceUrl,
                        ingested_at: datetime()
                    })
                    CREATE (c)-[:BELONGS_TO]->(f)
                    RETURN c.id as contextId
                `;

                await session.run(query, {
                    featureName: args.feature_name,
                    contextId: contextId,
                    sourceType: args.source_type,
                    content: args.content,
                    sourceUrl: args.source_url || null,
                });
            } finally {
                await session.close();
            }

            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(
                            {
                                status: 'success',
                                context_id: contextId,
                                feature_name: args.feature_name,
                                source_type: args.source_type,
                                message: `Context ingested successfully`,
                            },
                            null,
                            2
                        ),
                    },
                ],
            };
        } catch (error) {
            throw new McpError(ErrorCode.InternalError, `Failed to ingest context: ${String(error)}`);
        }
    }

    /**
     * Tool 3: generate_spec
     * Trigger spec generation pipeline (connects to /api/specs/generate)
     */
    private async handleGenerateSpec(args: any) {
        if (!args.feature_name) {
            throw new McpError(ErrorCode.InvalidParams, 'feature_name is required');
        }

        // In production, this would call POST /api/specs/generate
        // For now, return job ID that can be polled
        const jobId = crypto.randomUUID();

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(
                        {
                            status: 'queued',
                            job_id: jobId,
                            feature_name: args.feature_name,
                            polling_endpoint: `/api/specs/generate/status?job_id=${jobId}`,
                            message: 'Spec generation queued. Poll the endpoint to check progress.',
                        },
                        null,
                        2
                    ),
                },
            ],
        };
    }

    /**
     * Tool 4: list_features
     * List all features with spec status
     */
    private async handleListFeatures(args: any) {
        const session = memgraphClient.session();
        try {
            let query = `
                MATCH (f:Feature)
                OPTIONAL MATCH (f)-[:HAS_SPEC]->(s:Spec)
                RETURN {
                    id: f.id,
                    name: f.name,
                    spec_status: CASE WHEN s IS NULL THEN 'no_spec' 
                                      WHEN s.status = 'approved' THEN 'approved'
                                      WHEN s.status = 'simulated' THEN 'simulated'
                                      ELSE 'draft' END,
                    created_at: f.created_at
                } as feature
            `;

            // Add search filter if provided
            if (args.search) {
                query = query.replace(
                    'MATCH (f:Feature)',
                    `MATCH (f:Feature) WHERE f.name =~ '(?i).*${args.search}.*'`
                );
            }

            // Add status filter if provided
            if (args.status) {
                query = query.replace(
                    'MATCH (f:Feature)',
                    `MATCH (f:Feature) WHERE s.status = '${args.status}'`
                );
            }

            const result = await session.run(query);

            const features = result.records.map((r) => r.get('feature'));

            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(
                            {
                                total: features.length,
                                features: features,
                            },
                            null,
                            2
                        ),
                    },
                ],
            };
        } catch (error) {
            throw new McpError(ErrorCode.InternalError, `Failed to list features: ${String(error)}`);
        } finally {
            await session.close();
        }
    }

    /**
     * Tool 5: get_constraints
     * Quick reference — just the constraint layer
     */
    private async handleGetConstraints(args: any) {
        if (!args.feature_name) {
            throw new McpError(ErrorCode.InvalidParams, 'feature_name is required');
        }

        const session = memgraphClient.session();
        try {
            const query = `
                MATCH (f:Feature {name: $featureName})
                OPTIONAL MATCH (f)-[:HAS_SPEC]->(s:Spec)
                RETURN {
                    feature: f.name,
                    constraints: s.constraints,
                    constraint_count: size(s.constraints)
                } as result
            `;

            const result = await session.run(query, { featureName: args.feature_name });

            if (result.records.length === 0) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(
                                { error: 'Feature not found', feature: args.feature_name },
                                null,
                                2
                            ),
                        },
                    ],
                };
            }

            const record = result.records[0].get('result');
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(record, null, 2),
                    },
                ],
            };
        } catch (error) {
            throw new McpError(ErrorCode.InternalError, `Failed to get constraints: ${String(error)}`);
        } finally {
            await session.close();
        }
    }

    /**
     * Tool 6: run_simulation
     * Trigger pre-code simulation
     */
    private async handleRunSimulation(args: any) {
        if (!args.spec_id) {
            throw new McpError(ErrorCode.InvalidParams, 'spec_id is required');
        }

        // In production, this would call POST /api/specs/simulate
        const jobId = crypto.randomUUID();

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(
                        {
                            status: 'queued',
                            job_id: jobId,
                            spec_id: args.spec_id,
                            polling_endpoint: `/api/specs/simulate/status?job_id=${jobId}`,
                            message: 'Simulation queued. Poll endpoint for results.',
                        },
                        null,
                        2
                    ),
                },
            ],
        };
    }

    /**
     * Generate mock 1536-dim embedding (TODO: use Cloudflare Workers AI)
     */
    private generateMockEmbedding(text: string): number[] {
        const seed = text.length;
        return Array(1536)
            .fill(0)
            .map((_, i) => Math.sin(seed + i) * 0.5 + 0.5);
    }

    /**
     * Run STDIO transport (for Claude Desktop, CLI)
     */
    async runStdio() {
        await setupMemgraph();
        await setupQdrant();

        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.error('[Specwright MCP] Running on STDIO (Claude Desktop / CLI)');
    }

    /**
     * Run HTTP server (for Cursor web integration)
     */
    async runHttp(port: number = 3001) {
        await setupMemgraph();
        await setupQdrant();

        const httpServer = http.createServer(async (req, res) => {
            // CORS headers
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

            if (req.method === 'OPTIONS') {
                res.writeHead(200);
                res.end();
                return;
            }

            // GET /mcp/manifest — Returns MCP server manifest
            if (req.method === 'GET' && req.url === '/mcp/manifest') {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(
                    JSON.stringify(
                        {
                            name: 'specwright-mcp-server',
                            version: '1.0.0',
                            tools: this.tools,
                        },
                        null,
                        2
                    )
                );
                return;
            }

            // POST /mcp/call — Call MCP tool
            if (req.method === 'POST' && req.url === '/mcp/call') {
                let body = '';
                req.on('data', (chunk) => {
                    body += chunk.toString();
                });

                req.on('end', async () => {
                    try {
                        const { tool_name, arguments: toolArgs } = JSON.parse(body);

                        // Create mock request object
                        const mockRequest = {
                            params: {
                                name: tool_name,
                                arguments: toolArgs,
                            },
                        };

                        // Route to handler
                        let result;
                        switch (tool_name) {
                            case 'fetch_spec':
                                result = await this.handleFetchSpec(toolArgs);
                                break;
                            case 'ingest_context':
                                result = await this.handleIngestContext(toolArgs);
                                break;
                            case 'generate_spec':
                                result = await this.handleGenerateSpec(toolArgs);
                                break;
                            case 'list_features':
                                result = await this.handleListFeatures(toolArgs);
                                break;
                            case 'get_constraints':
                                result = await this.handleGetConstraints(toolArgs);
                                break;
                            case 'run_simulation':
                                result = await this.handleRunSimulation(toolArgs);
                                break;
                            default:
                                res.writeHead(404, { 'Content-Type': 'application/json' });
                                res.end(JSON.stringify({ error: 'Unknown tool' }));
                                return;
                        }

                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify(result, null, 2));
                    } catch (error) {
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: String(error) }));
                    }
                });
                return;
            }

            res.writeHead(404);
            res.end('Not Found');
        });

        httpServer.listen(port, () => {
            console.error(`[Specwright MCP] HTTP server listening on http://localhost:${port}`);
            console.error('[Specwright MCP] Available endpoints:');
            console.error(`  GET  /mcp/manifest        — Server manifest + tool definitions`);
            console.error(`  POST /mcp/call            — Call a tool`);
        });
    }

    /**
     * Graceful shutdown
     */
    private async shutdown() {
        console.error('[Specwright MCP] Shutting down...');
        await this.server.close();
        if (memgraphClient) {
            // Add closing logic if needed
        }
        process.exit(0);
    }
}

/**
 * Main entry point
 */
async function main() {
    const mode = process.env.MCP_SERVER_MODE || 'stdio';
    const server = new SpecwrightMCPServer();

    if (mode === 'http') {
        const port = parseInt(process.env.MCP_HTTP_PORT || '3001', 10);
        await server.runHttp(port);
    } else {
        // Default: STDIO
        await server.runStdio();
    }
}

main().catch((error) => {
    console.error('[Specwright MCP] Fatal error:', error);
    process.exit(1);
});
