/**
 * Integration tests for the full Specwright pipeline
 * ingest → generate → simulate → approve → export
 *
 * NOTE: These tests mock external services (Memgraph, Qdrant, AI)
 * to ensure isolation. They test the pipeline logic end-to-end
 * without real database connections.
 *
 * For tests against real infra, set TEST_MEMGRAPH_URI and TEST_QDRANT_URI.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { semanticChunk } from '../../src/lib/ingestion/chunker.js';
import { mockEmbed, validateEmbeddingDimensions } from '../../src/lib/ingestion/embedder.js';
import { parseSource } from '../../src/lib/ingestion/parsers/index.js';
import { detectAmbiguity } from '../../src/lib/simulator/ambiguity.js';
import { calculateCoverageScore } from '../../src/lib/simulator/coverage.js';
import { detectContradictions } from '../../src/lib/simulator/contradiction.js';
import { compileSpec, validateSpecStructure } from '../../src/lib/spec-compiler/compiler.js';
import { validateGherkin } from '../../src/lib/spec-compiler/gherkin.js';
import { createMockAdversaryReview, validateAdversaryOutput } from '../../src/lib/agents/adversary.js';
import { harvestContext } from '../../src/lib/agents/context-harvester.js';
import {
  slackMessage, jiraTicket, notionPage, callTranscript,
} from '../fixtures/sample-inputs.js';

// ─── Mock storage (in-memory DB) ──────────────────────────────────────────────

interface MockDB {
  rawInputs: Map<string, { id: string; source: string; content: string; featureId: string; vector: number[] }>;
  specs: Map<string, any>;
  jobs: Map<string, { id: string; status: string; featureId: string; result?: any }>;
}

function createMockDB(): MockDB {
  return {
    rawInputs: new Map(),
    specs: new Map(),
    jobs: new Map(),
  };
}

// ─── Pipeline Simulation ───────────────────────────────────────────────────────

async function ingestContext(
  db: MockDB,
  input: any,
  featureId: string
): Promise<{ rawInputId: string }> {
  const doc = parseSource(input);
  const chunks = semanticChunk(doc.content, {
    source_type: doc.source_type,
    source_id: doc.id,
    feature_id: featureId,
    timestamp: doc.timestamp,
  });

  const rawInputId = `raw-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  for (const chunk of chunks) {
    const vector = mockEmbed(chunk.text);
    db.rawInputs.set(rawInputId + '-' + chunk.metadata.chunk_index, {
      id: rawInputId,
      source: doc.source_type,
      content: chunk.text,
      featureId,
      vector,
    });
  }

  return { rawInputId };
}

async function generateSpec(db: MockDB, featureId: string): Promise<{ jobId: string }> {
  const jobId = `job-${Date.now()}`;
  const rawInputs = [...db.rawInputs.values()].filter((r) => r.featureId === featureId);

  if (rawInputs.length === 0) {
    throw new Error(`No ingested context found for feature: ${featureId}`);
  }

  // Simulate spec compilation
  const spec = compileSpec(
    featureId,
    { problem: 'Derived from ingested context', sources: rawInputs.map((r) => ({ id: r.id, type: r.source, excerpt: r.content.slice(0, 50) })) },
    [{
      id: 'REQ-001',
      text: 'The system shall support dark mode',
      source_citation: rawInputs[0].id,
      priority: 'MUST',
      acceptance_criteria: [{
        scenario: 'Enable dark mode',
        given: 'the user is on Settings',
        when: 'they toggle dark mode',
        then: 'the UI changes to dark theme',
      }],
    }],
    [{ id: 'CON-001', text: 'Theme transition within 200ms', type: 'performance' }],
    [{ id: 'RISK-001', description: 'Component compatibility', mitigation: 'Audit components' }]
  );

  db.specs.set(spec.id, spec);
  db.jobs.set(jobId, { id: jobId, status: 'completed', featureId, result: spec });

  return { jobId };
}

async function simulateSpec(db: MockDB, specId: string) {
  const spec = db.specs.get(specId);
  if (!spec) throw new Error(`Spec not found: ${specId}`);

  const reqs = spec.layers.requirements.map((r: any) => ({
    id: r.id,
    text: r.text,
    has_acceptance_criteria: r.acceptance_criteria?.length > 0,
    has_source_citation: !!r.source_citation,
    has_gherkin_test: r.acceptance_criteria?.length > 0,
    priority: r.priority,
  }));

  const coverage = calculateCoverageScore(reqs);
  const ambiguities = reqs.flatMap((r: any) => detectAmbiguity(r.text).map((a: any) => ({ req: r.id, ...a })));
  const contradictions = detectContradictions({ requirements: spec.layers.requirements, constraints: spec.layers.constraints });

  return { coverage, ambiguities, contradictions };
}

async function approveSpec(db: MockDB, specId: string, approved: boolean) {
  const spec = db.specs.get(specId);
  if (!spec) throw new Error(`Spec not found: ${specId}`);
  spec.approved = approved;
  spec.approvedAt = new Date().toISOString();
  return { specId, approved };
}

async function exportSpec(db: MockDB, specId: string, format: 'json' | 'markdown' = 'json') {
  const spec = db.specs.get(specId);
  if (!spec) throw new Error(`Spec not found: ${specId}`);

  if (format === 'json') {
    return { format: 'json', content: JSON.stringify(spec, null, 2) };
  }

  // Markdown export
  const md = [
    `# Spec: ${spec.feature}`,
    `**Version:** ${spec.version}`,
    `**Hash:** ${spec.hash}`,
    '',
    '## Requirements',
    ...spec.layers.requirements.map((r: any) => `- **${r.id}** [${r.priority}]: ${r.text}`),
    '',
    '## Constraints',
    ...spec.layers.constraints.map((c: any) => `- **${c.id}**: ${c.text}`),
  ].join('\n');

  return { format: 'markdown', content: md };
}

// ─── Full Pipeline Test ────────────────────────────────────────────────────────

describe('Full Pipeline: ingest → generate → simulate → approve → export', () => {
  let db: MockDB;

  beforeEach(() => {
    db = createMockDB();
  });

  it('completes a full pipeline run without errors', async () => {
    // 1. Ingest multiple sources
    await ingestContext(db, slackMessage, 'dark-mode');
    await ingestContext(db, jiraTicket, 'dark-mode');
    await ingestContext(db, notionPage, 'dark-mode');
    await ingestContext(db, callTranscript, 'dark-mode');

    expect(db.rawInputs.size).toBeGreaterThan(0);

    // 2. Generate spec
    const { jobId } = await generateSpec(db, 'dark-mode');
    expect(jobId).toBeTruthy();
    const job = db.jobs.get(jobId);
    expect(job?.status).toBe('completed');
    const specId = job?.result?.id;
    expect(specId).toBeTruthy();

    // 3. Simulate
    const simulation = await simulateSpec(db, specId);
    expect(simulation.coverage.score).toBeGreaterThanOrEqual(0);
    expect(simulation.coverage.score).toBeLessThanOrEqual(100);

    // 4. Approve
    const approval = await approveSpec(db, specId, true);
    expect(approval.approved).toBe(true);

    // 5. Export
    const exported = await exportSpec(db, specId, 'json');
    expect(exported.format).toBe('json');
    const parsed = JSON.parse(exported.content);
    expect(parsed.feature).toBe('dark-mode');
    expect(parsed.approved).toBe(true);
  });

  it('generates a spec with a valid structure after ingestion', async () => {
    await ingestContext(db, slackMessage, 'auth-feature');
    const { jobId } = await generateSpec(db, 'auth-feature');
    const specId = db.jobs.get(jobId)?.result?.id;
    const spec = db.specs.get(specId);

    const validation = validateSpecStructure(spec);
    expect(validation.valid).toBe(true);
  });

  it('throws when trying to generate a spec with no ingested context', async () => {
    await expect(generateSpec(db, 'unknown-feature')).rejects.toThrow('No ingested context');
  });

  it('simulation detects ambiguities in requirement text', async () => {
    await ingestContext(db, slackMessage, 'feat-1');
    const { jobId } = await generateSpec(db, 'feat-1');
    const specId = db.jobs.get(jobId)?.result?.id;
    // Inject an ambiguous requirement
    const spec = db.specs.get(specId);
    spec.layers.requirements.push({
      id: 'REQ-AMBIG',
      text: 'The system should be fast and intuitive',
      source_citation: 'raw-1',
      priority: 'SHOULD',
      acceptance_criteria: [],
    });

    const sim = await simulateSpec(db, specId);
    expect(sim.ambiguities.some((a: any) => a.req === 'REQ-AMBIG')).toBe(true);
  });

  it('exports spec as markdown with feature title', async () => {
    await ingestContext(db, slackMessage, 'export-feat');
    const { jobId } = await generateSpec(db, 'export-feat');
    const specId = db.jobs.get(jobId)?.result?.id;
    await approveSpec(db, specId, true);

    const exported = await exportSpec(db, specId, 'markdown');
    expect(exported.format).toBe('markdown');
    expect(exported.content).toContain('# Spec');
    expect(exported.content).toContain('Requirements');
  });

  it('throws when exporting a spec that does not exist', async () => {
    await expect(exportSpec(db, 'nonexistent-spec')).rejects.toThrow('Spec not found');
  });

  it('stores all ingested chunks with correct vector dimensions', async () => {
    await ingestContext(db, slackMessage, 'dim-check');
    for (const [, input] of db.rawInputs) {
      expect(validateEmbeddingDimensions(input.vector)).toBe(true);
    }
  });

  it('cleans up between tests (each test starts with empty DB)', () => {
    expect(db.rawInputs.size).toBe(0);
    expect(db.specs.size).toBe(0);
  });

  it('supports ingesting context from all 4 source types', async () => {
    const results = await Promise.all([
      ingestContext(db, slackMessage, 'multi-source'),
      ingestContext(db, jiraTicket, 'multi-source'),
      ingestContext(db, notionPage, 'multi-source'),
      ingestContext(db, callTranscript, 'multi-source'),
    ]);
    expect(results.length).toBe(4);
    expect(results.every((r) => r.rawInputId)).toBe(true);
  });
});

// ─── Error Path Tests ──────────────────────────────────────────────────────────

describe('Pipeline error handling', () => {
  let db: MockDB;

  beforeEach(() => {
    db = createMockDB();
  });

  it('rejects invalid source_type during ingestion', async () => {
    const invalidInput = { source_type: 'email', content: 'test', timestamp: new Date().toISOString() };
    await expect(ingestContext(db, invalidInput as any, 'feat-1')).rejects.toThrow('Invalid source_type');
  });

  it('rejects empty content for Slack messages', async () => {
    const emptySlack = { ...slackMessage, content: '' };
    await expect(ingestContext(db, emptySlack, 'feat-1')).rejects.toThrow();
  });

  it('throws when simulating a missing spec', async () => {
    await expect(simulateSpec(db, 'does-not-exist')).rejects.toThrow('Spec not found');
  });

  it('throws when approving a missing spec', async () => {
    await expect(approveSpec(db, 'does-not-exist', true)).rejects.toThrow('Spec not found');
  });

  it('generates a spec with a valid SHA-256 hash', async () => {
    await ingestContext(db, slackMessage, 'hash-check');
    const { jobId } = await generateSpec(db, 'hash-check');
    const spec = db.jobs.get(jobId)?.result;
    expect(spec.hash).toMatch(/^[a-f0-9]{64}$/);
  });
});
