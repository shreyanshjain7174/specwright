/**
 * Shared MCP Tool Handlers
 *
 * Used by both:
 * - /api/mcp route (production HTTP, deployed on Vercel/Docker)
 * - src/index.ts STDIO server (local Cursor/Claude Desktop)
 *
 * All tools use Neon PostgreSQL (the production database).
 */

import { getDb } from '@/lib/db';
import crypto from 'crypto';

/* ─── Types ───────────────────────────────────────────────────────────────────── */

export interface ToolDefinition {
    name: string;
    description: string;
    inputSchema: Record<string, unknown>;
}

export interface ToolResult {
    content: Array<{ type: 'text'; text: string }>;
    isError?: boolean;
}

/* ─── Tool Definitions ────────────────────────────────────────────────────────── */

export const TOOL_DEFINITIONS: ToolDefinition[] = [
    {
        name: 'fetch_spec',
        description: 'Retrieve a complete Executable Specification by feature name or ID',
        inputSchema: {
            type: 'object',
            properties: {
                feature_name: { type: 'string', description: 'Feature name or ID' },
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
                    enum: ['slack', 'jira', 'notion', 'gong', 'confluence', 'transcript', 'manual'],
                    description: 'Source type of the context',
                },
                content: { type: 'string', description: 'Raw text content to ingest' },
                feature_name: { type: 'string', description: 'Feature this context belongs to (creates feature if new)' },
            },
            required: ['source_type', 'content', 'feature_name'],
        },
    },
    {
        name: 'generate_spec',
        description: 'Generate an Executable Specification from ingested context for a feature',
        inputSchema: {
            type: 'object',
            properties: {
                feature_name: { type: 'string', description: 'Feature to generate spec for' },
            },
            required: ['feature_name'],
        },
    },
    {
        name: 'list_features',
        description: 'List all features with their spec status and context counts',
        inputSchema: {
            type: 'object',
            properties: {
                search: { type: 'string', description: 'Optional search term to filter features' },
            },
        },
    },
    {
        name: 'get_constraints',
        description: 'Retrieve only the Constraint Layer (DO NOT rules) for a feature — quick reference during coding',
        inputSchema: {
            type: 'object',
            properties: {
                feature_name: { type: 'string', description: 'Feature to get constraints for' },
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
                feature_name: { type: 'string', description: 'Feature name to simulate spec for' },
            },
            required: ['feature_name'],
        },
    },
];

/* ─── Tool Router ─────────────────────────────────────────────────────────────── */

export async function callTool(toolName: string, args: Record<string, unknown>): Promise<ToolResult> {
    switch (toolName) {
        case 'fetch_spec':
            return handleFetchSpec(args);
        case 'ingest_context':
            return handleIngestContext(args);
        case 'generate_spec':
            return handleGenerateSpec(args);
        case 'list_features':
            return handleListFeatures(args);
        case 'get_constraints':
            return handleGetConstraints(args);
        case 'run_simulation':
            return handleRunSimulation(args);
        default:
            return jsonResult({ error: `Unknown tool: ${toolName}` }, true);
    }
}

/* ─── Helpers ─────────────────────────────────────────────────────────────────── */

function jsonResult(data: unknown, isError = false): ToolResult {
    return {
        content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
        isError,
    };
}

/* ─── Tool 1: fetch_spec ──────────────────────────────────────────────────────── */

async function handleFetchSpec(args: Record<string, unknown>): Promise<ToolResult> {
    const featureName = String(args.feature_name || '');
    if (!featureName) return jsonResult({ error: 'feature_name is required' }, true);

    try {
        const sql = getDb();

        const features = await sql`
      SELECT id, name, description, created_at
      FROM features WHERE name ILIKE ${`%${featureName}%`}
      ORDER BY created_at DESC LIMIT 1
    `;

        if (features.length === 0) {
            return jsonResult({ error: 'Feature not found', feature: featureName });
        }

        const feature = features[0];

        // Get latest spec (uses `details` column, not spec_json)
        const specs = await sql`
      SELECT id, title, details, status, content_hash, created_at
      FROM specs WHERE feature_id = ${feature.id}
      ORDER BY created_at DESC LIMIT 1
    `;

        // Get raw inputs count
        const inputs = await sql`
      SELECT COUNT(*) as count FROM raw_inputs WHERE feature_id = ${feature.id}
    `;

        const result: Record<string, unknown> = {
            feature_id: feature.id,
            feature_name: feature.name,
            description: feature.description,
            raw_input_count: Number(inputs[0]?.count || 0),
        };

        if (specs.length > 0) {
            const spec = specs[0];
            const details = typeof spec.details === 'string' ? JSON.parse(spec.details) : spec.details;
            result.spec = {
                id: spec.id,
                title: spec.title,
                status: spec.status,
                content: details,
                created_at: spec.created_at,
            };
        }

        return jsonResult(result);
    } catch (error) {
        return jsonResult({ error: `Failed to fetch spec: ${String(error)}` }, true);
    }
}

/* ─── Tool 2: ingest_context ──────────────────────────────────────────────────── */

async function handleIngestContext(args: Record<string, unknown>): Promise<ToolResult> {
    const sourceType = String(args.source_type || '');
    const content = String(args.content || '');
    const featureName = String(args.feature_name || '');

    if (!sourceType || !content || !featureName) {
        return jsonResult({ error: 'source_type, content, and feature_name are required' }, true);
    }

    try {
        const sql = getDb();
        const contextId = crypto.randomUUID();

        // Upsert feature (uses `name` as the unique key via ON CONFLICT)
        let features = await sql`
      SELECT id FROM features WHERE name = ${featureName}
    `;

        let featureId: string;
        if (features.length === 0) {
            featureId = crypto.randomUUID();
            await sql`
        INSERT INTO features (id, name, description)
        VALUES (${featureId}, ${featureName}, ${`Context from ${sourceType}`})
      `;
        } else {
            featureId = features[0].id;
            await sql`UPDATE features SET updated_at = NOW() WHERE id = ${featureId}`;
        }

        // Insert raw input (column is `source`, not `source_type`)
        await sql`
      INSERT INTO raw_inputs (id, feature_id, source, content)
      VALUES (${contextId}, ${featureId}, ${sourceType}, ${content})
    `;

        return jsonResult({
            status: 'success',
            context_id: contextId,
            feature_id: featureId,
            feature_name: featureName,
            source_type: sourceType,
            message: 'Context ingested successfully. Run generate_spec to create a spec from this context.',
        });
    } catch (error) {
        return jsonResult({ error: `Failed to ingest context: ${String(error)}` }, true);
    }
}

/* ─── Tool 3: generate_spec ───────────────────────────────────────────────────── */

async function handleGenerateSpec(args: Record<string, unknown>): Promise<ToolResult> {
    const featureName = String(args.feature_name || '');
    if (!featureName) return jsonResult({ error: 'feature_name is required' }, true);

    try {
        const sql = getDb();

        const features = await sql`
      SELECT id, name FROM features WHERE name ILIKE ${`%${featureName}%`}
      ORDER BY created_at DESC LIMIT 1
    `;

        if (features.length === 0) {
            return jsonResult({ error: 'Feature not found. Ingest context first with ingest_context tool.' }, true);
        }

        const feature = features[0];

        // Gather all raw inputs
        const inputs = await sql`
      SELECT source, content FROM raw_inputs
      WHERE feature_id = ${feature.id} ORDER BY created_at ASC
    `;

        if (inputs.length === 0) {
            return jsonResult({
                error: 'No context found for this feature. Use ingest_context first.',
                feature: feature.name,
            }, true);
        }

        // Combine context
        const combinedContext = inputs
            .map((i: { source: string; content: string }) => `[${i.source}]\n${i.content}`)
            .join('\n\n---\n\n');

        // Call compile endpoint (reuse existing API)
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL
            || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

        const compileRes = await fetch(`${baseUrl}/api/specs/compile`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ context: combinedContext, featureId: feature.id }),
        });

        const compileData = await compileRes.json();

        if (compileData.error) {
            return jsonResult({ error: `Spec generation failed: ${compileData.error}` }, true);
        }

        return jsonResult({
            status: 'success',
            feature: feature.name,
            feature_id: feature.id,
            spec: compileData.spec,
            message: 'Spec generated. Use fetch_spec to retrieve the full spec, or run_simulation to validate it.',
        });
    } catch (error) {
        return jsonResult({ error: `Failed to generate spec: ${String(error)}` }, true);
    }
}

/* ─── Tool 4: list_features ───────────────────────────────────────────────────── */

async function handleListFeatures(args: Record<string, unknown>): Promise<ToolResult> {
    try {
        const sql = getDb();
        const search = args.search ? String(args.search) : null;

        let features;
        if (search) {
            features = await sql`
        SELECT f.id, f.name, f.description, f.created_at, f.updated_at,
               COUNT(DISTINCT r.id) as raw_input_count,
               COUNT(DISTINCT s.id) as spec_count
        FROM features f
        LEFT JOIN raw_inputs r ON r.feature_id = f.id
        LEFT JOIN specs s ON s.feature_id = f.id
        WHERE f.name ILIKE ${`%${search}%`} OR f.description ILIKE ${`%${search}%`}
        GROUP BY f.id ORDER BY f.updated_at DESC
      `;
        } else {
            features = await sql`
        SELECT f.id, f.name, f.description, f.created_at, f.updated_at,
               COUNT(DISTINCT r.id) as raw_input_count,
               COUNT(DISTINCT s.id) as spec_count
        FROM features f
        LEFT JOIN raw_inputs r ON r.feature_id = f.id
        LEFT JOIN specs s ON s.feature_id = f.id
        GROUP BY f.id ORDER BY f.updated_at DESC
      `;
        }

        return jsonResult({
            total: features.length,
            features: features.map((f: Record<string, unknown>) => ({
                id: f.id,
                name: f.name,
                description: f.description,
                raw_input_count: Number(f.raw_input_count),
                spec_count: Number(f.spec_count),
                created_at: f.created_at,
                updated_at: f.updated_at,
            })),
        });
    } catch (error) {
        return jsonResult({ error: `Failed to list features: ${String(error)}` }, true);
    }
}

/* ─── Tool 5: get_constraints ─────────────────────────────────────────────────── */

async function handleGetConstraints(args: Record<string, unknown>): Promise<ToolResult> {
    const featureName = String(args.feature_name || '');
    if (!featureName) return jsonResult({ error: 'feature_name is required' }, true);

    try {
        const sql = getDb();

        // Specs table uses `details` JSONB column, not `spec_json`
        const specs = await sql`
      SELECT s.details FROM specs s
      JOIN features f ON s.feature_id = f.id
      WHERE f.name ILIKE ${`%${featureName}%`}
      ORDER BY s.created_at DESC LIMIT 1
    `;

        if (specs.length === 0) {
            return jsonResult({ error: 'No spec found for this feature', feature: featureName });
        }

        const details = typeof specs[0].details === 'string' ? JSON.parse(specs[0].details) : specs[0].details;
        const constraints = details?.constraints || details?.constraint_layer || [];

        return jsonResult({
            feature: featureName,
            constraints,
            constraint_count: Array.isArray(constraints) ? constraints.length : 0,
            usage: 'These are DO NOT rules. Violating any constraint is a spec failure.',
        });
    } catch (error) {
        return jsonResult({ error: `Failed to get constraints: ${String(error)}` }, true);
    }
}

/* ─── Tool 6: run_simulation ──────────────────────────────────────────────────── */

async function handleRunSimulation(args: Record<string, unknown>): Promise<ToolResult> {
    const featureName = String(args.feature_name || '');
    if (!featureName) return jsonResult({ error: 'feature_name is required' }, true);

    try {
        const sql = getDb();

        const specs = await sql`
      SELECT s.details FROM specs s
      JOIN features f ON s.feature_id = f.id
      WHERE f.name ILIKE ${`%${featureName}%`}
      ORDER BY s.created_at DESC LIMIT 1
    `;

        if (specs.length === 0) {
            return jsonResult({ error: 'No spec found. Run generate_spec first.', feature: featureName }, true);
        }

        const details = typeof specs[0].details === 'string' ? JSON.parse(specs[0].details) : specs[0].details;

        // Call simulate endpoint
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL
            || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

        const simRes = await fetch(`${baseUrl}/api/specs/simulate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ spec: details }),
        });

        const simData = await simRes.json();

        if (simData.error) {
            return jsonResult({ error: `Simulation failed: ${simData.error}` }, true);
        }

        return jsonResult({
            feature: featureName,
            simulation: simData.result,
            message: simData.result?.passed
                ? 'All scenarios passed. Spec is ready for implementation.'
                : 'Some scenarios failed. Review simulation.failures for details.',
        });
    } catch (error) {
        return jsonResult({ error: `Failed to run simulation: ${String(error)}` }, true);
    }
}
