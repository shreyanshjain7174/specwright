/**
 * Unit tests for the Agent system
 * Tests: orchestrator ReAct loop, reasoning traces, context harvesting,
 *        spec draft evidence grounding, adversary review JSON output
 */
import { describe, it, expect, vi } from 'vitest';
import { runReActLoop, type OrchestratorState } from '../../src/lib/agents/orchestrator.js';
import { rerankChunks, harvestContext, type RankingConfig } from '../../src/lib/agents/context-harvester.js';
import {
  validateAdversaryOutput,
  createMockAdversaryReview,
  type AdversaryFinding,
} from '../../src/lib/agents/adversary.js';
import type { ContextChunk } from '../../src/lib/agents/types.js';

// ─── Orchestrator ReAct Loop ───────────────────────────────────────────────────

describe('runReActLoop', () => {
  it('terminates and returns a trace when reasonFn signals done', async () => {
    const reasonFn = vi.fn().mockResolvedValueOnce({
      thought: 'I have enough information',
      action: 'finish',
      action_input: null,
      observation: null,
      done: true,
      answer: { result: 'Dark mode spec generated' },
    });

    const trace = await runReActLoop('Generate dark mode spec', reasonFn);
    expect(trace.steps).toHaveLength(1);
    expect(trace.final_answer).toEqual({ result: 'Dark mode spec generated' });
    expect(trace.steps[0].thought).toBe('I have enough information');
  });

  it('runs multiple reasoning steps before finishing', async () => {
    const reasonFn = vi.fn()
      .mockResolvedValueOnce({
        thought: 'Need to fetch context',
        action: 'search_context',
        action_input: { query: 'dark mode requirements' },
        done: false,
      })
      .mockResolvedValueOnce({
        thought: 'Context retrieved, ready to compile',
        action: 'finish',
        action_input: null,
        done: true,
        answer: 'spec compiled',
      });

    const trace = await runReActLoop('Build spec', reasonFn);
    expect(trace.steps).toHaveLength(2);
    expect(trace.steps[0].action).toBe('search_context');
    expect(trace.steps[1].action).toBe('finish');
  });

  it('respects maxSteps limit to prevent infinite loops', async () => {
    // reasonFn always says not done
    const reasonFn = vi.fn().mockResolvedValue({
      thought: 'Still thinking...',
      action: 'search',
      action_input: {},
      done: false,
    });

    const trace = await runReActLoop('Infinite loop query', reasonFn, { maxSteps: 3 });
    expect(trace.steps.length).toBeLessThanOrEqual(3);
  });

  it('logs a reasoning trace with thought, action, and action_input for each step', async () => {
    const reasonFn = vi.fn().mockResolvedValueOnce({
      thought: 'Analyze requirements',
      action: 'analyze',
      action_input: { feature: 'dark-mode' },
      done: true,
      answer: 'done',
    });

    const trace = await runReActLoop('Analyze', reasonFn);
    const step = trace.steps[0];
    expect(step.thought).toBeTruthy();
    expect(step.action).toBeTruthy();
    expect(step.action_input).toBeDefined();
  });

  it('includes agent_id, session_id, and duration_ms in the trace', async () => {
    const reasonFn = vi.fn().mockResolvedValue({ thought: 't', action: 'finish', action_input: null, done: true, answer: 'x' });
    const trace = await runReActLoop('Query', reasonFn, { agentId: 'test-agent' });
    expect(trace.agent_id).toBe('test-agent');
    expect(trace.session_id).toBeTruthy();
    expect(trace.duration_ms).toBeGreaterThanOrEqual(0);
  });

  it('calls available tools when an action matches a tool name', async () => {
    const mockTool = vi.fn().mockResolvedValue({ data: 'tool result' });
    const reasonFn = vi.fn()
      .mockResolvedValueOnce({
        thought: 'Call the search tool',
        action: 'search',
        action_input: { query: 'dark mode' },
        done: false,
      })
      .mockResolvedValueOnce({
        thought: 'Done',
        action: 'finish',
        action_input: null,
        done: true,
        answer: 'complete',
      });

    const trace = await runReActLoop('Query', reasonFn, { tools: { search: mockTool } });
    expect(mockTool).toHaveBeenCalledWith({ query: 'dark mode' });
    // The observation should be set after tool call
    expect(trace.steps[0].observation).toContain('tool result');
  });

  it('records tool errors in the observation without crashing', async () => {
    const failingTool = vi.fn().mockRejectedValue(new Error('Tool failed'));
    const reasonFn = vi.fn()
      .mockResolvedValueOnce({
        thought: 'Call tool',
        action: 'broken_tool',
        action_input: {},
        done: false,
      })
      .mockResolvedValueOnce({
        thought: 'Handle error gracefully',
        action: 'finish',
        action_input: null,
        done: true,
        answer: 'handled',
      });

    const trace = await runReActLoop('Query', reasonFn, { tools: { broken_tool: failingTool } });
    expect(trace.steps[0].observation).toContain('Error');
  });
});

// ─── Context Harvester - Re-ranking ───────────────────────────────────────────

const makeChunk = (id: string, score: number, daysOld = 0): ContextChunk => ({
  id,
  text: `Context chunk ${id}`,
  score,
  metadata: {
    timestamp: new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000).toISOString(),
  },
});

describe('rerankChunks', () => {
  it('returns chunks sorted by combined score (descending)', () => {
    const chunks = [
      makeChunk('c1', 0.5, 60),
      makeChunk('c2', 0.9, 0),
      makeChunk('c3', 0.7, 15),
    ];
    const ranked = rerankChunks(chunks);
    expect(ranked[0].score).toBeGreaterThanOrEqual(ranked[1].score);
    expect(ranked[1].score).toBeGreaterThanOrEqual(ranked[2].score);
  });

  it('boosts more recent chunks above older ones with same similarity', () => {
    const recent = makeChunk('recent', 0.7, 1);
    const old = makeChunk('old', 0.7, 90);
    const ranked = rerankChunks([old, recent]);
    expect(ranked[0].id).toBe('recent');
  });

  it('respects the recencyWeight and similarityWeight config', () => {
    const highSimilarityOld = makeChunk('h-sim', 0.95, 60);
    const lowSimilarityNew = makeChunk('l-sim', 0.3, 0);

    // With high similarity weight, the high-similarity-but-old chunk wins
    const simFocused = rerankChunks(
      [highSimilarityOld, lowSimilarityNew],
      { similarityWeight: 0.9, recencyWeight: 0.1 }
    );
    expect(simFocused[0].id).toBe('h-sim');

    // With high recency weight, the recent chunk wins
    const recencyFocused = rerankChunks(
      [highSimilarityOld, lowSimilarityNew],
      { similarityWeight: 0.1, recencyWeight: 0.9 }
    );
    expect(recencyFocused[0].id).toBe('l-sim');
  });

  it('handles missing timestamps gracefully', () => {
    const chunk = { id: 'no-ts', text: 'test', score: 0.8, metadata: {} };
    expect(() => rerankChunks([chunk])).not.toThrow();
  });

  it('returns the same number of chunks as input', () => {
    const chunks = [makeChunk('a', 0.5), makeChunk('b', 0.8), makeChunk('c', 0.3)];
    expect(rerankChunks(chunks)).toHaveLength(3);
  });
});

describe('harvestContext', () => {
  it('returns at most topK chunks', () => {
    const chunks = Array.from({ length: 10 }, (_, i) => makeChunk(`c${i}`, Math.random()));
    const result = harvestContext(chunks, 5);
    expect(result).toHaveLength(5);
  });

  it('returns all chunks when fewer than topK available', () => {
    const chunks = [makeChunk('a', 0.5), makeChunk('b', 0.8)];
    const result = harvestContext(chunks, 10);
    expect(result).toHaveLength(2);
  });

  it('returns the highest-scoring chunks', () => {
    const chunks = [
      makeChunk('low', 0.1),
      makeChunk('high', 0.95),
      makeChunk('mid', 0.5),
    ];
    const result = harvestContext(chunks, 1);
    expect(result[0].id).toBe('high');
  });

  it('returns empty array for empty input', () => {
    expect(harvestContext([], 5)).toHaveLength(0);
  });
});

// ─── Adversary Review Agent ────────────────────────────────────────────────────

describe('validateAdversaryOutput', () => {
  it('returns true for a valid adversary review object', () => {
    const review = createMockAdversaryReview('dark-mode', 'spec-v1');
    expect(validateAdversaryOutput(review)).toBe(true);
  });

  it('returns false for null or non-object input', () => {
    expect(validateAdversaryOutput(null)).toBe(false);
    expect(validateAdversaryOutput('string')).toBe(false);
    expect(validateAdversaryOutput(42)).toBe(false);
  });

  it('returns false when feature_id is missing', () => {
    const review = createMockAdversaryReview('dark-mode', 'spec-v1');
    delete (review as any).feature_id;
    expect(validateAdversaryOutput(review)).toBe(false);
  });

  it('returns false when findings is not an array', () => {
    const review = { ...createMockAdversaryReview('dm', 'spec-1'), findings: {} };
    expect(validateAdversaryOutput(review)).toBe(false);
  });

  it('returns false when confidence_score is out of range', () => {
    const review = { ...createMockAdversaryReview('dm', 'spec-1'), confidence_score: 150 };
    expect(validateAdversaryOutput(review)).toBe(false);

    const review2 = { ...createMockAdversaryReview('dm', 'spec-1'), confidence_score: -5 };
    expect(validateAdversaryOutput(review2)).toBe(false);
  });

  it('validates finding type values', () => {
    const badFinding = {
      type: 'unknown_type',
      severity: 'warning',
      description: 'Some issue',
    };
    const review = { ...createMockAdversaryReview('dm', 'spec-1'), findings: [badFinding] };
    expect(validateAdversaryOutput(review)).toBe(false);
  });

  it('validates finding severity values', () => {
    const badFinding = {
      type: 'gap',
      severity: 'catastrophic', // invalid
      description: 'Some issue',
    };
    const review = { ...createMockAdversaryReview('dm', 'spec-1'), findings: [badFinding] };
    expect(validateAdversaryOutput(review)).toBe(false);
  });
});

describe('createMockAdversaryReview', () => {
  it('sets approval_recommended to true when there are no critical findings', () => {
    const findings: AdversaryFinding[] = [
      { type: 'ambiguity', severity: 'warning', description: 'Vague term found' },
    ];
    const review = createMockAdversaryReview('dm', 'spec-1', findings);
    expect(review.approval_recommended).toBe(true);
  });

  it('sets approval_recommended to false when there are critical findings', () => {
    const findings: AdversaryFinding[] = [
      { type: 'contradiction', severity: 'critical', description: 'Critical conflict' },
    ];
    const review = createMockAdversaryReview('dm', 'spec-1', findings);
    expect(review.approval_recommended).toBe(false);
  });

  it('returns a confidence_score between 0 and 100', () => {
    const review = createMockAdversaryReview('dm', 'spec-1');
    expect(review.confidence_score).toBeGreaterThanOrEqual(0);
    expect(review.confidence_score).toBeLessThanOrEqual(100);
  });

  it('reduces confidence_score proportional to finding severity', () => {
    const clean = createMockAdversaryReview('dm', 'spec-1', []);
    const withCritical = createMockAdversaryReview('dm', 'spec-1', [
      { type: 'contradiction', severity: 'critical', description: 'Issue' },
    ]);
    expect(withCritical.confidence_score).toBeLessThan(clean.confidence_score);
  });

  it('produces output that passes validateAdversaryOutput', () => {
    const findings: AdversaryFinding[] = [
      { type: 'gap', severity: 'info', description: 'Minor gap', suggestion: 'Add more detail' },
      { type: 'ambiguity', severity: 'warning', description: 'Vague language', requirement_id: 'REQ-001' },
    ];
    const review = createMockAdversaryReview('dark-mode', 'spec-dark-mode-v1', findings);
    expect(validateAdversaryOutput(review)).toBe(true);
  });
});
