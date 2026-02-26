/**
 * Global test setup/teardown for Specwright
 * Runs before all test files
 */
import { vi, beforeEach, afterEach, afterAll } from 'vitest';

// ─── Environment ───────────────────────────────────────────────────────────────
// Use test-specific env vars so we never touch production data
process.env.MEMGRAPH_URI = process.env.TEST_MEMGRAPH_URI || 'bolt://localhost:7688';
process.env.QDRANT_URI = process.env.TEST_QDRANT_URI || 'http://localhost:6334';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/specwright_test';

// ─── Global mock cleanup ────────────────────────────────────────────────────────
beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

afterAll(() => {
  vi.resetModules();
});
