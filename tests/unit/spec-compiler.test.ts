/**
 * Unit tests for the Spec Compiler
 * Tests: 4-layer structure, source citations, Gherkin validation,
 *        SHA-256 hashing, spec versioning
 */
import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import {
  compileSpec,
  computeSpecHash,
  validateSpecStructure,
  type Requirement,
  type Constraint,
  type Risk,
  type SpecContext,
  type SpecDocument,
} from '../../src/lib/spec-compiler/compiler.js';
import { validateGherkin } from '../../src/lib/spec-compiler/gherkin.js';
import { gherkinSpec, invalidGherkinSpec } from '../fixtures/sample-inputs.js';
import sampleSpecJson from '../fixtures/sample-spec.json' assert { type: 'json' };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeMinimalSpec(): SpecDocument {
  const context: SpecContext = {
    problem: 'Users cannot use the app in dark environments',
    sources: [{ id: 'raw-1', type: 'slack', excerpt: 'Need dark mode' }],
  };
  const requirements: Requirement[] = [{
    id: 'REQ-001',
    text: 'The system SHALL provide a dark mode toggle',
    source_citation: 'raw-1',
    priority: 'MUST',
    acceptance_criteria: [{
      scenario: 'Toggle dark mode',
      given: 'the user is on Settings',
      when: 'they toggle the Dark Mode switch',
      then: 'the UI switches to dark theme',
    }],
  }];
  const constraints: Constraint[] = [{
    id: 'CON-001',
    text: 'Theme transition MUST complete within 200ms',
    type: 'performance',
  }];
  const risks: Risk[] = [{
    id: 'RISK-001',
    description: 'Third-party components may not support dark mode',
    mitigation: 'Audit all UI components',
  }];
  return compileSpec('dark-mode', context, requirements, constraints, risks);
}

// ─── 4-Layer Structure ─────────────────────────────────────────────────────────

describe('compileSpec - 4-layer structure', () => {
  it('creates a spec with all 4 required layers', () => {
    const spec = makeMinimalSpec();
    expect(spec.layers).toHaveProperty('context');
    expect(spec.layers).toHaveProperty('requirements');
    expect(spec.layers).toHaveProperty('constraints');
    expect(spec.layers).toHaveProperty('risks');
  });

  it('sets the feature ID correctly', () => {
    const spec = makeMinimalSpec();
    expect(spec.feature).toBe('dark-mode');
  });

  it('assigns a non-empty ID to the spec', () => {
    const spec = makeMinimalSpec();
    expect(spec.id).toBeTruthy();
    expect(spec.id.length).toBeGreaterThan(5);
  });

  it('includes context.problem and context.sources', () => {
    const spec = makeMinimalSpec();
    expect(spec.layers.context.problem).toBeTruthy();
    expect(spec.layers.context.sources.length).toBeGreaterThan(0);
  });

  it('preserves all provided requirements', () => {
    const spec = makeMinimalSpec();
    expect(spec.layers.requirements).toHaveLength(1);
    expect(spec.layers.requirements[0].id).toBe('REQ-001');
  });

  it('preserves all provided constraints', () => {
    const spec = makeMinimalSpec();
    expect(spec.layers.constraints).toHaveLength(1);
    expect(spec.layers.constraints[0].id).toBe('CON-001');
  });

  it('preserves all provided risks', () => {
    const spec = makeMinimalSpec();
    expect(spec.layers.risks).toHaveLength(1);
    expect(spec.layers.risks[0].id).toBe('RISK-001');
  });
});

// ─── Source Citations ──────────────────────────────────────────────────────────

describe('validateSpecStructure - source citations', () => {
  it('passes validation when every requirement has a source citation', () => {
    const spec = makeMinimalSpec();
    const result = validateSpecStructure(spec);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('fails validation when a requirement is missing a source citation', () => {
    const spec = makeMinimalSpec();
    spec.layers.requirements[0].source_citation = '';
    const result = validateSpecStructure(spec);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('source_citation'))).toBe(true);
  });

  it('reports the specific requirement ID that is missing a citation', () => {
    const spec = makeMinimalSpec();
    spec.layers.requirements[0].source_citation = '';
    const result = validateSpecStructure(spec);
    expect(result.errors.some((e) => e.includes('REQ-001'))).toBe(true);
  });

  it('fails when requirements array is empty', () => {
    const spec = makeMinimalSpec();
    spec.layers.requirements = [];
    const result = validateSpecStructure(spec);
    expect(result.valid).toBe(false);
  });

  it('fails when a layer is missing entirely', () => {
    const spec = makeMinimalSpec();
    delete (spec.layers as any).constraints;
    const result = validateSpecStructure(spec);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.toLowerCase().includes('constraint'))).toBe(true);
  });
});

// ─── SHA-256 Hash ──────────────────────────────────────────────────────────────

describe('computeSpecHash', () => {
  it('returns a 64-character hex string (SHA-256)', () => {
    const spec = makeMinimalSpec();
    const hash = computeSpecHash(spec);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('compiles a spec with a hash that matches content', () => {
    const spec = makeMinimalSpec();
    const expectedHash = computeSpecHash(spec);
    expect(spec.hash).toBe(expectedHash);
  });

  it('produces different hashes for different content', () => {
    const spec1 = makeMinimalSpec();
    const spec2 = compileSpec(
      'dark-mode',
      { problem: 'Different problem', sources: [] },
      [],
      [],
      []
    );
    expect(spec1.hash).not.toBe(spec2.hash);
  });

  it('produces the same hash for identical content (deterministic)', () => {
    const spec = makeMinimalSpec();
    const h1 = computeSpecHash(spec);
    const h2 = computeSpecHash(spec);
    expect(h1).toBe(h2);
  });

  it('detects hash tampering during structure validation', () => {
    const spec = makeMinimalSpec();
    spec.hash = 'deadbeef'.repeat(8); // tamper the hash
    const result = validateSpecStructure(spec);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.toLowerCase().includes('hash'))).toBe(true);
  });

  it('uses SHA-256 algorithm specifically', () => {
    const spec = makeMinimalSpec();
    const content = JSON.stringify({
      id: spec.id,
      feature: spec.feature,
      version: spec.version,
      layers: spec.layers,
    });
    const expected = crypto.createHash('sha256').update(content).digest('hex');
    expect(spec.hash).toBe(expected);
  });
});

// ─── Spec Versioning ───────────────────────────────────────────────────────────

describe('compileSpec - versioning', () => {
  it('starts at version 1.0.0 when no previous version is provided', () => {
    const spec = makeMinimalSpec();
    expect(spec.version).toBe('1.0.0');
  });

  it('increments patch version when previous version is provided', () => {
    const spec = compileSpec('dark-mode', { problem: 'test', sources: [] }, [], [], [], '1.0.0');
    expect(spec.version).toBe('1.0.1');
  });

  it('handles multiple version increments', () => {
    let version = '1.0.0';
    for (let i = 1; i <= 5; i++) {
      const spec = compileSpec('dark-mode', { problem: 'test', sources: [] }, [], [], [], version);
      version = spec.version;
    }
    expect(version).toBe('1.0.5');
  });

  it('includes the version in the spec ID', () => {
    const spec = makeMinimalSpec();
    expect(spec.id).toContain(spec.version.replace('.', ''));
  });
});

// ─── Gherkin Validation ────────────────────────────────────────────────────────

describe('validateGherkin', () => {
  it('returns valid: true for a well-formed Gherkin spec', () => {
    const result = validateGherkin(gherkinSpec);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('counts scenarios correctly', () => {
    const result = validateGherkin(gherkinSpec);
    expect(result.scenarioCount).toBeGreaterThanOrEqual(1);
  });

  it('returns valid: false when Feature keyword is missing', () => {
    const noFeature = `Scenario: Some scenario\n  Given a user\n  When they act\n  Then something happens`;
    const result = validateGherkin(noFeature);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.toLowerCase().includes('feature'))).toBe(true);
  });

  it('returns valid: false when Scenario keyword is missing', () => {
    const noScenario = `Feature: Dark Mode\n  Given a user exists\n  When they do something`;
    const result = validateGherkin(noScenario);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.toLowerCase().includes('scenario'))).toBe(true);
  });

  it('returns valid: false when a scenario is missing a When step', () => {
    const noWhen = `Feature: Auth\n  Scenario: Login\n    Given a user on login page\n    Then the user is logged in`;
    const result = validateGherkin(noWhen);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.toLowerCase().includes('when'))).toBe(true);
  });

  it('returns valid: false when a scenario is missing a Then step', () => {
    const noThen = `Feature: Auth\n  Scenario: Login\n    Given a user on login page\n    When they click submit`;
    const result = validateGherkin(noThen);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.toLowerCase().includes('then'))).toBe(true);
  });

  it('returns valid: false for the invalidGherkinSpec fixture', () => {
    const result = validateGherkin(invalidGherkinSpec);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('handles empty input gracefully', () => {
    const result = validateGherkin('');
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

// ─── Sample Spec JSON Fixture Validation ──────────────────────────────────────

describe('sample-spec.json fixture', () => {
  it('has all 4 layers', () => {
    const spec = sampleSpecJson as any;
    expect(spec.layers).toHaveProperty('context');
    expect(spec.layers).toHaveProperty('requirements');
    expect(spec.layers).toHaveProperty('constraints');
    expect(spec.layers).toHaveProperty('risks');
  });

  it('has at least one requirement', () => {
    const spec = sampleSpecJson as any;
    expect(spec.layers.requirements.length).toBeGreaterThan(0);
  });

  it('has source citations on all requirements', () => {
    const spec = sampleSpecJson as any;
    for (const req of spec.layers.requirements) {
      expect(req.source_citation).toBeTruthy();
    }
  });
});
