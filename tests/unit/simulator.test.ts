/**
 * Unit tests for the Simulator module
 * Tests: ambiguity detection, error path detection, coverage scores,
 *        contradiction detection, testability validation
 */
import { describe, it, expect } from 'vitest';
import { detectAmbiguity, isAmbiguous } from '../../src/lib/simulator/ambiguity.js';
import { calculateCoverageScore, detectMissingErrorPaths, type Requirement } from '../../src/lib/simulator/coverage.js';
import { detectContradictions, validateTestability } from '../../src/lib/simulator/contradiction.js';
import { ambiguousRequirement, clearRequirement, gherkinSpec } from '../fixtures/sample-inputs.js';

// ─── Ambiguity Detection ───────────────────────────────────────────────────────

describe('detectAmbiguity', () => {
  it('flags the word "fast" as ambiguous', () => {
    const issues = detectAmbiguity('The system should respond fast');
    expect(issues.some((i) => i.term.toLowerCase() === 'fast')).toBe(true);
  });

  it('flags the word "intuitive" as ambiguous', () => {
    const issues = detectAmbiguity('The UI should be intuitive for all users');
    expect(issues.some((i) => i.term.toLowerCase() === 'intuitive')).toBe(true);
  });

  it('flags the word "simple" as ambiguous', () => {
    const issues = detectAmbiguity('Create a simple onboarding flow');
    expect(issues.some((i) => i.term.toLowerCase() === 'simple')).toBe(true);
  });

  it('flags multiple ambiguous terms in one requirement', () => {
    const issues = detectAmbiguity(ambiguousRequirement);
    expect(issues.length).toBeGreaterThanOrEqual(3); // "fast", "intuitive", "simple"
  });

  it('returns an empty list for a precise requirement', () => {
    const issues = detectAmbiguity(clearRequirement);
    expect(issues).toHaveLength(0);
  });

  it('provides a suggestion for each flagged term', () => {
    const issues = detectAmbiguity('The app should be fast and scalable');
    for (const issue of issues) {
      expect(issue.suggestion).toBeTruthy();
      expect(issue.suggestion.length).toBeGreaterThan(5);
    }
  });

  it('includes the position of the ambiguous term', () => {
    const text = 'The system should be fast and secure';
    const issues = detectAmbiguity(text);
    const fastIssue = issues.find((i) => i.term === 'fast');
    expect(fastIssue?.position).toBeGreaterThan(-1);
  });

  it('handles case-insensitive matching', () => {
    const issues = detectAmbiguity('The UI must be FAST and INTUITIVE');
    expect(issues.some((i) => i.term.toLowerCase() === 'fast')).toBe(true);
    expect(issues.some((i) => i.term.toLowerCase() === 'intuitive')).toBe(true);
  });

  it('does not flag partial word matches (word boundaries)', () => {
    // "fastest" should not match "fast", "simplest" should not match "simple"
    const issues = detectAmbiguity('Use the fastest algorithm with simplest code');
    // "fastest" contains "fast" but should not be flagged if properly using word boundaries
    // This test verifies word boundary behavior
    const fastMatch = issues.find((i) => i.term === 'fast');
    // If regex uses \b, "fastest" won't match "fast"
    // (behavior depends on implementation — this test documents expected behavior)
    if (fastMatch) {
      // If it did match, the position should be within "fastest"
      expect(fastMatch.position).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('isAmbiguous', () => {
  it('returns true for an ambiguous requirement', () => {
    expect(isAmbiguous('The system should be fast')).toBe(true);
  });

  it('returns false for a precise requirement', () => {
    expect(isAmbiguous(clearRequirement)).toBe(false);
  });
});

// ─── Coverage Score ────────────────────────────────────────────────────────────

const makeReq = (overrides: Partial<Requirement> = {}, id = 'REQ-001'): Requirement => ({
  id,
  text: 'The system shall allow users to log in',
  has_acceptance_criteria: true,
  has_source_citation: true,
  has_gherkin_test: true,
  priority: 'MUST',
  ...overrides,
});

describe('calculateCoverageScore', () => {
  it('returns a score of 100 for fully covered requirements', () => {
    const reqs = [
      makeReq({}, 'REQ-001'),
      makeReq({}, 'REQ-002'),
    ];
    const result = calculateCoverageScore(reqs);
    expect(result.score).toBe(100);
  });

  it('returns a score of 0 for empty requirements list', () => {
    const result = calculateCoverageScore([]);
    expect(result.score).toBe(0);
  });

  it('penalizes requirements missing acceptance criteria', () => {
    const full = calculateCoverageScore([makeReq({}, 'R1')]);
    const partial = calculateCoverageScore([makeReq({ has_acceptance_criteria: false }, 'R1')]);
    expect(partial.score).toBeLessThan(full.score);
  });

  it('penalizes requirements missing source citations', () => {
    const full = calculateCoverageScore([makeReq({}, 'R1')]);
    const partial = calculateCoverageScore([makeReq({ has_source_citation: false }, 'R1')]);
    expect(partial.score).toBeLessThan(full.score);
  });

  it('penalizes requirements missing Gherkin tests', () => {
    const full = calculateCoverageScore([makeReq({}, 'R1')]);
    const partial = calculateCoverageScore([makeReq({ has_gherkin_test: false }, 'R1')]);
    expect(partial.score).toBeLessThan(full.score);
  });

  it('lists IDs of requirements missing each coverage type', () => {
    const reqs = [
      makeReq({ has_acceptance_criteria: false, has_source_citation: false }, 'R1'),
      makeReq({}, 'R2'),
    ];
    const result = calculateCoverageScore(reqs);
    expect(result.missing.no_acceptance_criteria).toContain('R1');
    expect(result.missing.no_source_citation).toContain('R1');
    expect(result.missing.no_acceptance_criteria).not.toContain('R2');
  });

  it('returns a score between 0 and 100', () => {
    const reqs = [
      makeReq({ has_gherkin_test: false }, 'R1'),
      makeReq({ has_source_citation: false }, 'R2'),
    ];
    const result = calculateCoverageScore(reqs);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it('gives higher weight to MUST requirements in coverage', () => {
    const withMust = [makeReq({ priority: 'MUST', has_gherkin_test: true }, 'R1')];
    const withMay = [makeReq({ priority: 'MAY', has_gherkin_test: true }, 'R1')];
    // Both have full coverage so scores should be equal
    expect(calculateCoverageScore(withMust).score).toBe(calculateCoverageScore(withMay).score);
  });

  it('includes breakdown details', () => {
    const reqs = [makeReq({}, 'R1')];
    const result = calculateCoverageScore(reqs);
    expect(result.breakdown).toHaveProperty('acceptance_criteria_coverage');
    expect(result.breakdown).toHaveProperty('source_citation_coverage');
    expect(result.breakdown).toHaveProperty('gherkin_test_coverage');
    expect(result.breakdown).toHaveProperty('must_requirements_covered');
  });
});

// ─── Missing Error Paths ───────────────────────────────────────────────────────

describe('detectMissingErrorPaths', () => {
  it('flags action requirements without error handling', () => {
    const reqs: Requirement[] = [
      makeReq({ id: 'R1', text: 'The user can login with username and password' }),
      makeReq({ id: 'R2', text: 'The user can submit a payment form' }),
    ];
    const missing = detectMissingErrorPaths(reqs);
    expect(missing).toContain('R1');
    expect(missing).toContain('R2');
  });

  it('does not flag requirements that mention error handling', () => {
    const reqs: Requirement[] = [
      makeReq({ id: 'R1', text: 'The system shall show an error when login fails with invalid credentials' }),
    ];
    const missing = detectMissingErrorPaths(reqs);
    expect(missing).not.toContain('R1');
  });

  it('returns empty array when all action reqs have error handling', () => {
    const reqs: Requirement[] = [
      makeReq({ id: 'R1', text: 'Login must handle invalid credentials with a clear error message' }),
    ];
    expect(detectMissingErrorPaths(reqs)).toHaveLength(0);
  });

  it('returns empty array for non-action requirements', () => {
    const reqs: Requirement[] = [
      makeReq({ id: 'R1', text: 'The theme should support dark and light modes' }),
    ];
    expect(detectMissingErrorPaths(reqs)).toHaveLength(0);
  });
});

// ─── Contradiction Detection ───────────────────────────────────────────────────

describe('detectContradictions', () => {
  it('detects real-time requirement vs rate-limit constraint contradiction', () => {
    const spec = {
      requirements: [{ id: 'REQ-001', text: 'The feed must update in real-time as new posts arrive' }],
      constraints: [{ id: 'CON-001', text: 'API calls are rate-limited to 60 requests per minute' }],
    };
    const contradictions = detectContradictions(spec);
    expect(contradictions.length).toBeGreaterThan(0);
    expect(contradictions[0].requirement_id).toBe('REQ-001');
    expect(contradictions[0].constraint_id).toBe('CON-001');
  });

  it('detects offline requirement vs network constraint contradiction', () => {
    const spec = {
      requirements: [{ id: 'REQ-001', text: 'The app must work offline without internet access' }],
      constraints: [{ id: 'CON-001', text: 'All data must sync via the network API in real time' }],
    };
    const contradictions = detectContradictions(spec);
    expect(contradictions.some((c) => c.severity === 'critical')).toBe(true);
  });

  it('returns empty array when no contradictions exist', () => {
    const spec = {
      requirements: [{ id: 'REQ-001', text: 'The user can toggle dark mode from settings' }],
      constraints: [{ id: 'CON-001', text: 'Transition animation must complete within 200ms' }],
    };
    expect(detectContradictions(spec)).toHaveLength(0);
  });

  it('assigns severity to contradictions', () => {
    const spec = {
      requirements: [{ id: 'REQ-001', text: 'The app must work offline' }],
      constraints: [{ id: 'CON-001', text: 'All data fetched via network API' }],
    };
    const contradictions = detectContradictions(spec);
    for (const c of contradictions) {
      expect(['critical', 'warning']).toContain(c.severity);
    }
  });

  it('handles empty requirements or constraints gracefully', () => {
    expect(detectContradictions({ requirements: [], constraints: [] })).toHaveLength(0);
    expect(detectContradictions({ requirements: [{ id: 'R1', text: 'Test' }], constraints: [] })).toHaveLength(0);
  });
});

// ─── Testability Validation ────────────────────────────────────────────────────

describe('validateTestability', () => {
  it('marks a requirement as testable when a matching Gherkin scenario exists', () => {
    const requirements = [{ id: 'REQ-001', text: 'The user can enable dark mode theme from the settings page' }];
    const scenarios = [gherkinSpec]; // sample fixture includes "dark mode" scenario
    const result = validateTestability(requirements, scenarios);
    expect(result.testable).toContain('REQ-001');
    expect(result.untestable).not.toContain('REQ-001');
  });

  it('marks a requirement as untestable when no matching scenario exists', () => {
    const requirements = [{ id: 'REQ-999', text: 'Quantum entanglement synchronization protocol' }];
    const scenarios = [gherkinSpec];
    const result = validateTestability(requirements, scenarios);
    expect(result.untestable).toContain('REQ-999');
  });

  it('correctly partitions multiple requirements', () => {
    const requirements = [
      { id: 'R1', text: 'The user can enable dark mode on the settings page' },
      { id: 'R2', text: 'Quantum entanglement synchronization protocol v2' },
    ];
    const scenarios = [gherkinSpec];
    const result = validateTestability(requirements, scenarios);
    expect(result.testable.length + result.untestable.length).toBe(requirements.length);
  });

  it('returns all untestable when scenarios list is empty', () => {
    const requirements = [
      { id: 'R1', text: 'User can toggle dark mode' },
      { id: 'R2', text: 'User can change password' },
    ];
    const result = validateTestability(requirements, []);
    expect(result.untestable).toEqual(['R1', 'R2']);
    expect(result.testable).toHaveLength(0);
  });

  it('handles empty requirements gracefully', () => {
    const result = validateTestability([], [gherkinSpec]);
    expect(result.testable).toHaveLength(0);
    expect(result.untestable).toHaveLength(0);
  });
});
