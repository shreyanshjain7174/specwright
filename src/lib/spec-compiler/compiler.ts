/**
 * Spec Compiler - assembles the 4-layer specification document
 * Layers: Context → Requirements → Constraints → Risks
 */
import crypto from 'crypto';

export interface SpecContext {
  problem: string;
  sources: Array<{ id: string; type: string; excerpt: string }>;
}

export interface AcceptanceCriteria {
  scenario: string;
  given: string;
  when: string;
  then: string;
}

export interface Requirement {
  id: string;
  text: string;
  source_citation: string; // ID of the raw input that justifies this
  priority: 'MUST' | 'SHOULD' | 'MAY';
  acceptance_criteria: AcceptanceCriteria[];
}

export interface Constraint {
  id: string;
  text: string;
  type: 'performance' | 'security' | 'compliance' | 'technical';
}

export interface Risk {
  id: string;
  description: string;
  mitigation: string;
}

export interface SpecDocument {
  id: string;
  feature: string;
  version: string;
  hash: string;
  layers: {
    context: SpecContext;
    requirements: Requirement[];
    constraints: Constraint[];
    risks: Risk[];
  };
}

/**
 * Compute a SHA-256 hash of the spec content (excluding the hash field itself)
 */
export function computeSpecHash(spec: Omit<SpecDocument, 'hash'>): string {
  const content = JSON.stringify({
    id: spec.id,
    feature: spec.feature,
    version: spec.version,
    layers: spec.layers,
  });
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Validate that a spec document is structurally complete
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateSpecStructure(spec: SpecDocument): ValidationResult {
  const errors: string[] = [];

  // Check 4 layers exist
  const { context, requirements, constraints, risks } = spec.layers ?? {};
  if (!context) errors.push('Missing layer: context');
  if (!requirements) errors.push('Missing layer: requirements');
  if (!constraints) errors.push('Missing layer: constraints');
  if (!risks) errors.push('Missing layer: risks');

  if (!Array.isArray(requirements) || requirements.length === 0) {
    errors.push('Requirements layer must have at least one requirement');
  } else {
    // Every requirement must have a source citation
    for (const req of requirements) {
      if (!req.source_citation) {
        errors.push(`REQ ${req.id} is missing a source_citation`);
      }
      if (!req.id) errors.push('A requirement is missing an id');
      if (!req.text) errors.push('A requirement is missing text');
      if (!['MUST', 'SHOULD', 'MAY'].includes(req.priority)) {
        errors.push(`REQ ${req.id} has invalid priority: ${req.priority}`);
      }
      if (!Array.isArray(req.acceptance_criteria) || req.acceptance_criteria.length === 0) {
        errors.push(`REQ ${req.id} has no acceptance criteria`);
      }
    }
  }

  // Hash must match content
  if (spec.hash) {
    const expected = computeSpecHash(spec);
    if (spec.hash !== expected) {
      errors.push(`Hash mismatch: stored=${spec.hash.slice(0, 8)}... expected=${expected.slice(0, 8)}...`);
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Compile a new spec version from components
 */
export function compileSpec(
  featureId: string,
  context: SpecContext,
  requirements: Requirement[],
  constraints: Constraint[],
  risks: Risk[],
  previousVersion?: string
): SpecDocument {
  // Increment version
  const version = previousVersion ? bumpVersion(previousVersion) : '1.0.0';
  const id = `spec-${featureId}-v${version}`;

  const partialSpec: Omit<SpecDocument, 'hash'> = {
    id,
    feature: featureId,
    version,
    layers: { context, requirements, constraints, risks },
  };

  const hash = computeSpecHash(partialSpec);

  return { ...partialSpec, hash };
}

function bumpVersion(version: string): string {
  const parts = version.split('.').map(Number);
  parts[2] = (parts[2] ?? 0) + 1;
  return parts.join('.');
}
