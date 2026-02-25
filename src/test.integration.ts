/**
 * Integration test for Specwright MVP
 * Tests: Memgraph connectivity, Qdrant connectivity, schema setup, data ingestion, and graph traversal
 */

import neo4j from 'neo4j-driver';
import { QdrantClient } from '@qdrant/js-client-rest';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const MEMGRAPH_URI = process.env.MEMGRAPH_URI || 'bolt://localhost:7687';
const MEMGRAPH_USER = process.env.MEMGRAPH_USER || '';
const MEMGRAPH_PASSWORD = process.env.MEMGRAPH_PASSWORD || '';
const QDRANT_URI = process.env.QDRANT_URI || 'http://localhost:6333';

let passed = 0;
let failed = 0;

function log(status: string, name: string, detail?: string) {
  const icon = status === 'PASS' ? '✅' : '❌';
  console.log(`${icon} ${status}: ${name}${detail ? ` — ${detail}` : ''}`);
}

async function test(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    passed++;
    log('PASS', name);
  } catch (err: any) {
    failed++;
    log('FAIL', name, err.message);
  }
}

function mockEmbed(text: string): number[] {
  const seed = text.length;
  return Array(1536).fill(0).map((_, i) => Math.sin(seed + i));
}

async function main() {
  console.log('\n🧪 Specwright MVP — Integration Test Suite\n');
  console.log('─'.repeat(50));

  // --- Memgraph Tests ---

  const driver = neo4j.driver(MEMGRAPH_URI, neo4j.auth.basic(MEMGRAPH_USER, MEMGRAPH_PASSWORD));

  await test('Memgraph: connection', async () => {
    const session = driver.session();
    try {
      const result = await session.run('RETURN 1 AS n');
      const value = result.records[0].get('n').toNumber();
      if (value !== 1) throw new Error(`Expected 1, got ${value}`);
    } finally {
      await session.close();
    }
  });

  await test('Memgraph: create Feature node', async () => {
    const session = driver.session();
    try {
      await session.run('MATCH (n) DETACH DELETE n'); // clean slate
      await session.run('CREATE (f:Feature {id: "dark-mode"}) RETURN f');
      const result = await session.run('MATCH (f:Feature {id: "dark-mode"}) RETURN f');
      if (result.records.length !== 1) throw new Error('Feature node not created');
    } finally {
      await session.close();
    }
  });

  await test('Memgraph: create RawInput and TRACES_BACK_TO edge', async () => {
    const session = driver.session();
    try {
      await session.run(`
        MATCH (f:Feature {id: "dark-mode"})
        CREATE (r:RawInput {id: "raw-1", source: "Slack", content: "Users keep asking for dark mode in #feedback"})
        CREATE (r)-[:TRACES_BACK_TO]->(f)
        RETURN r
      `);
      const result = await session.run(`
        MATCH (r:RawInput)-[:TRACES_BACK_TO]->(f:Feature {id: "dark-mode"})
        RETURN r
      `);
      if (result.records.length !== 1) throw new Error('Edge not created');
    } finally {
      await session.close();
    }
  });

  await test('Memgraph: full graph traversal (Feature -> Spec -> RawInput)', async () => {
    const session = driver.session();
    try {
      // Create a Spec node and wire up the full graph
      await session.run(`
        MATCH (f:Feature {id: "dark-mode"})
        CREATE (s:Spec {id: "spec-dark-mode-1", details: "Implement system-wide dark/light toggle"})
        CREATE (f)-[:DECOMPOSED_INTO]->(s)
        WITH s
        MATCH (r:RawInput {id: "raw-1"})
        CREATE (s)-[:TRACES_BACK_TO]->(r)
        RETURN s
      `);

      // Now run the same query the MCP tool uses
      const result = await session.run(`
        MATCH (f:Feature {id: "dark-mode"})
        OPTIONAL MATCH (f)-[:DECOMPOSED_INTO]->(s:Spec)-[:TRACES_BACK_TO]->(r:RawInput)
        RETURN f, collect({spec: s, rawInput: r}) as traces
      `);
      
      if (result.records.length === 0) throw new Error('No records returned from traversal');
      const traces = result.records[0].get('traces');
      if (traces.length === 0) throw new Error('No traces found');
      if (!traces[0].spec) throw new Error('Spec missing from trace');
      if (!traces[0].rawInput) throw new Error('RawInput missing from trace');
    } finally {
      await session.close();
    }
  });

  // --- Qdrant Tests ---

  const qdrant = new QdrantClient({ url: QDRANT_URI });

  await test('Qdrant: connection (list collections)', async () => {
    const response = await qdrant.getCollections();
    if (!Array.isArray(response.collections)) throw new Error('Invalid response');
  });

  await test('Qdrant: create product_context collection', async () => {
    // Clean up if exists
    try { await qdrant.deleteCollection('product_context'); } catch { /* ignore */ }

    await qdrant.createCollection('product_context', {
      vectors: { size: 1536, distance: 'Cosine' },
    });

    const response = await qdrant.getCollections();
    const exists = response.collections.some((c) => c.name === 'product_context');
    if (!exists) throw new Error('Collection was not created');
  });

  await test('Qdrant: upsert and search vector', async () => {
    const testId = crypto.randomUUID();
    const content = 'Users keep asking for dark mode in #feedback';
    const vector = mockEmbed(content);

    await qdrant.upsert('product_context', {
      wait: true,
      points: [
        {
          id: testId,
          vector,
          payload: { source: 'Slack', content, featureId: 'dark-mode' },
        },
      ],
    });

    const searchResult = await qdrant.search('product_context', {
      vector: mockEmbed('dark mode feedback'),
      limit: 1,
    });

    if (searchResult.length === 0) throw new Error('Search returned no results');
    if (searchResult[0].payload?.source !== 'Slack') throw new Error('Payload mismatch');
  });

  // --- Summary ---
  console.log('\n' + '─'.repeat(50));
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed, ${passed + failed} total\n`);

  // Clean up
  await driver.close();

  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
