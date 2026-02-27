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
                feature_name: { type: 'string', description: 'Feature this context belongs to' },
                source_url: { type: 'string', description: 'Optional URL/reference to original source' },
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
                description: { type: 'string', description: 'Optional detailed description to include' },
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
                search: { type: 'string', description: 'Optional search term to filter features' },
                status: {
                    type: 'string',
                    enum: ['draft', 'simulated', 'approved', 'no_spec'],
                    description: 'Optional status filter',
                },
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

        // Find the feature
        const features = await sql`
      SELECT id, name, description, status, created_at
      FROM features WHERE name ILIKE ${`%${featureName}%`}
      ORDER BY created_at DESC LIMIT 1
    `;

        if (features.length === 0) {
            return jsonResult({ error: 'Feature not found', feature: featureName });
        }

        const feature = features[0];

        // Get latest spec
        const specs = await sql`
      SELECT id, version, status, spec_json, simulation_json, created_at
      FROM specs WHERE feature_id = ${feature.id}
      ORDER BY version DESC LIMIT 1
    `;

        // Get raw inputs count
        const inputs = await sql`
      SELECT COUNT(*) as count FROM raw_inputs WHERE feature_id = ${feature.id}
    `;

        const result: Record<string, unknown> = {
            feature_id: feature.id,
            feature_name: feature.name,
            description: feature.description,
            status: feature.status,
            raw_input_count: Number(inputs[0]?.count || 0),
        };

        if (specs.length > 0) {
            const spec = specs[0];
            result.spec = {
                id: spec.id,
                version: spec.version,
                status: spec.status,
                content: spec.spec_json,
                simulation: spec.simulation_json,
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
    const sourceUrl = args.source_url ? String(args.source_url) : null;

    if (!sourceType || !content || !featureName) {
        return jsonResult({ error: 'source_type, content, and feature_name are required' }, true);
    }

    try {
        const sql = getDb();
        const contextId = crypto.randomUUID();

        // Upsert feature
        const features = await sql`
      INSERT INTO features (name, description, status)
      VALUES (${featureName}, ${`Context from ${sourceType}`}, 'active')
      ON CONFLICT (name) DO UPDATE SET updated_at = NOW()
      RETURNING id
    `;
        const featureId = features[0].id;

        // Insert raw input
        await sql`
      INSERT INTO raw_inputs (id, feature_id, source_type, content, source_url)
      VALUES (${contextId}, ${featureId}, ${sourceType}, ${content}, ${sourceUrl})
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

        // Find feature
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
      SELECT source_type, content, source_url FROM raw_inputs
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
            .map((i) => `[${i.source_type}${i.source_url ? ` — ${i.source_url}` : ''}]\n${i.content}`)
            .join('\n\n');

        // Call compile endpoint (reuse existing API)
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL
            ? `https://${process.env.VERCEL_URL}`
            : 'http://localhost:3000';

        const compileRes = await fetch(`${baseUrl}/api/specs/compile`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ context: combinedContext, featureId: feature.id }),
        });

        const compileData = await compileRes.json();

        if (compileData.error) {
            return jsonResult({ error: `Spec generation failed: ${compileData.error}` }, true);
        }

        // Run simulation
        const simRes = await fetch(`${baseUrl}/api/specs/simulate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ spec: compileData.spec }),
        });

        const simData = await simRes.json();

        return jsonResult({
            status: 'success',
            feature: feature.name,
            spec: compileData.spec,
            simulation: simData.result || null,
            message: 'Spec generated and simulated. Use fetch_spec to retrieve the full spec.',
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
        SELECT f.id, f.name, f.description, f.status, f.created_at,
               COUNT(DISTINCT ri.id) as raw_input_count,
               COUNT(DISTINCT s.id) as spec_count,
               MAX(s.status) as spec_status
        FROM features f
        LEFT JOIN raw_inputs ri ON ri.feature_id = f.id
        LEFT JOIN specs s ON s.feature_id = f.id
        WHERE f.name ILIKE ${`%${search}%`} OR f.description ILIKE ${`%${search}%`}
        GROUP BY f.id ORDER BY f.created_at DESC
      `;
        } else {
            features = await sql`
        SELECT f.id, f.name, f.description, f.status, f.created_at,
               COUNT(DISTINCT ri.id) as raw_input_count,
               COUNT(DISTINCT s.id) as spec_count,
               MAX(s.status) as spec_status
        FROM features f
        LEFT JOIN raw_inputs ri ON ri.feature_id = f.id
        LEFT JOIN specs s ON s.feature_id = f.id
        GROUP BY f.id ORDER BY f.created_at DESC
      `;
        }

        return jsonResult({
            total: features.length,
            features: features.map((f) => ({
                id: f.id,
                name: f.name,
                description: f.description,
                status: f.status,
                spec_status: f.spec_status || 'no_spec',
                raw_input_count: Number(f.raw_input_count),
                spec_count: Number(f.spec_count),
                created_at: f.created_at,
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

        const specs = await sql`
      SELECT s.spec_json FROM specs s
      JOIN features f ON s.feature_id = f.id
      WHERE f.name ILIKE ${`%${featureName}%`}
      ORDER BY s.version DESC LIMIT 1
    `;

        if (specs.length === 0) {
            return jsonResult({ error: 'No spec found for this feature', feature: featureName });
        }

        const specJson = specs[0].spec_json;
        const parsed = typeof specJson === 'string' ? JSON.parse(specJson) : specJson;

        // Extract constraints from the spec
        const constraints = parsed?.constraints || parsed?.constraint_layer || [];

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
      SELECT s.spec_json FROM specs s
      JOIN features f ON s.feature_id = f.id
      WHERE f.name ILIKE ${`%${featureName}%`}
      ORDER BY s.version DESC LIMIT 1
    `;

        if (specs.length === 0) {
            return jsonResult({ error: 'No spec found. Run generate_spec first.', feature: featureName }, true);
        }

        const specJson = specs[0].spec_json;
        const parsed = typeof specJson === 'string' ? JSON.parse(specJson) : specJson;

        // Call simulate endpoint
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL
            ? `https://${process.env.VERCEL_URL}`
            : 'http://localhost:3000';

        const simRes = await fetch(`${baseUrl}/api/specs/simulate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ spec: parsed }),
        });

        const simData = await simRes.json();

        if (simData.error) {
            return jsonResult({ error: `Simulation failed: ${simData.error}` }, true);
        }

        return jsonResult({
            feature: featureName,
            simulation: simData.result,
            passed: simData.result?.passed || false,
            score: simData.result ? Math.round((simData.result.passedScenarios / Math.max(simData.result.totalScenarios, 1)) * 100) : 0,
            message: simData.result?.passed
                ? 'All scenarios passed. Spec is ready for implementation.'
                : 'Some scenarios failed. Review simulation.failures for details.',
        });
    } catch (error) {
        return jsonResult({ error: `Failed to run simulation: ${String(error)}` }, true);
    }
}
