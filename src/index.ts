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

class SpecwrightServer {
    private server: Server;

    constructor() {
        this.server = new Server(
            {
                name: 'specwright-mcp-server',
                version: '0.1.0',
            },
            {
                capabilities: {
                    tools: {},
                },
            }
        );

        this.setupToolHandlers();

        // Error handling
        this.server.onerror = (error) => console.error('[MCP Error]', error);
        process.on('SIGINT', async () => {
            await this.server.close();
            await memgraphClient.close();
            process.exit(0);
        });
    }

    private setupToolHandlers() {
        this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
            tools: [
                {
                    name: 'generate_traceable_spec',
                    description: 'Generates a highly structured specification from a Feature with traceability to raw inputs',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            featureName: {
                                type: 'string',
                                description: 'The name or ID of the feature to generate the spec for',
                            },
                        },
                        required: ['featureName'],
                    },
                },
                {
                    name: 'ingest_context',
                    description: 'Ingests context from a source, links it to a feature in Memgraph, and stores it in Qdrant',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            source: {
                                type: 'string',
                                description: 'The source of the raw input (e.g. Slack, user call)',
                            },
                            content: {
                                type: 'string',
                                description: 'The actual raw text content from the source',
                            },
                            linkedFeatureId: {
                                type: 'string',
                                description: 'The ID of the Feature this context belongs to',
                            },
                        },
                        required: ['source', 'content', 'linkedFeatureId'],
                    },
                },
            ],
        }));

        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            switch (request.params.name) {
                case 'generate_traceable_spec':
                    return this.handleGenerateTraceableSpec(request.params.arguments);
                case 'ingest_context':
                    return this.handleIngestContext(request.params.arguments);
                default:
                    throw new McpError(
                        ErrorCode.MethodNotFound,
                        `Unknown tool: ${request.params.name}`
                    );
            }
        });
    }

    private async handleGenerateTraceableSpec(args: any) {
        if (!args.featureName) {
            throw new McpError(ErrorCode.InvalidParams, 'featureName is required');
        }

        const session = memgraphClient.session();
        try {
            const query = `
        MATCH (f:Feature {id: $featureName})
        OPTIONAL MATCH (f)-[:DECOMPOSED_INTO]->(s:Spec)-[:TRACES_BACK_TO]->(r:RawInput)
        RETURN f, collect({spec: s, rawInput: r}) as traces
      `;
            const result = await session.run(query, { featureName: args.featureName });

            if (result.records.length === 0) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({ error: 'Feature not found' }, null, 2),
                        },
                    ],
                };
            }

            const record = result.records[0];
            const feature = record.get('f').properties;
            const traces = record.get('traces');

            const spec = {
                feature: feature.id,
                specifications: traces.map((t: any) => ({
                    specDetails: t.spec?.properties || null,
                    justification: t.rawInput?.properties?.content || null,
                    source: t.rawInput?.properties?.source || null,
                })).filter((t: any) => t.specDetails !== null),
            };

            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(spec, null, 2),
                    },
                ],
            };
        } catch (error) {
            console.error('Error in generate_traceable_spec:', error);
            throw new McpError(ErrorCode.InternalError, String(error));
        } finally {
            await session.close();
        }
    }

    // Mock embedding function for the MVP (returns 1536 dim vector)
    private mockEmbed(text: string): number[] {
        const seed = text.length;
        return Array(1536).fill(0).map((_, i) => Math.sin(seed + i));
    }

    private async handleIngestContext(args: any) {
        if (!args.source || !args.content || !args.linkedFeatureId) {
            throw new McpError(
                ErrorCode.InvalidParams,
                'source, content, and linkedFeatureId are required'
            );
        }

        const rawInputId = crypto.randomUUID();
        const vector = this.mockEmbed(args.content);

        try {
            // 1. Store in Qdrant
            await qdrantClient.upsert('product_context', {
                wait: true,
                points: [
                    {
                        id: rawInputId,
                        vector: vector,
                        payload: {
                            source: args.source,
                            content: args.content,
                            featureId: args.linkedFeatureId,
                        },
                    },
                ],
            });

            // 2. Store in Memgraph
            const session = memgraphClient.session();
            try {
                const query = `
          MERGE (f:Feature {id: $featureId})
          CREATE (r:RawInput {id: $rawInputId, source: $source, content: $content})
          CREATE (r)-[:TRACES_BACK_TO]->(f)
          RETURN r
        `;
                await session.run(query, {
                    featureId: args.linkedFeatureId,
                    rawInputId: rawInputId,
                    source: args.source,
                    content: args.content,
                });
            } finally {
                await session.close();
            }

            return {
                content: [
                    {
                        type: 'text',
                        text: \`Successfully ingested context. RawInput ID: \${rawInputId}\`,
          },
        ],
      };
    } catch (error) {
      console.error('Error in ingest_context:', error);
      throw new McpError(ErrorCode.InternalError, String(error));
    }
  }

  async run() {
    await setupMemgraph();
    await setupQdrant();
    
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Specwright MCP server running on stdio');
  }
}

const server = new SpecwrightServer();
server.run().catch(console.error);
