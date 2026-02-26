/**
 * Adversary Review Agent
 * Challenges the spec by attempting to find gaps, ambiguities, and contradictions
 * Returns structured JSON with findings
 */

export interface AdversaryFinding {
  type: 'gap' | 'ambiguity' | 'contradiction' | 'missing_error_path' | 'untestable';
  severity: 'critical' | 'warning' | 'info';
  requirement_id?: string;
  description: string;
  suggestion?: string;
}

export interface AdversaryReview {
  feature_id: string;
  spec_id: string;
  findings: AdversaryFinding[];
  approval_recommended: boolean;
  confidence_score: number; // 0-100
}

/**
 * Validates that adversary output conforms to the expected JSON schema
 */
export function validateAdversaryOutput(output: unknown): output is AdversaryReview {
  if (typeof output !== 'object' || output === null) return false;
  const o = output as Record<string, unknown>;
  if (typeof o.feature_id !== 'string') return false;
  if (typeof o.spec_id !== 'string') return false;
  if (!Array.isArray(o.findings)) return false;
  if (typeof o.approval_recommended !== 'boolean') return false;
  if (typeof o.confidence_score !== 'number') return false;
  if (o.confidence_score < 0 || o.confidence_score > 100) return false;

  for (const finding of o.findings as unknown[]) {
    if (!isValidFinding(finding)) return false;
  }
  return true;
}

function isValidFinding(f: unknown): f is AdversaryFinding {
  if (typeof f !== 'object' || f === null) return false;
  const finding = f as Record<string, unknown>;
  const validTypes = ['gap', 'ambiguity', 'contradiction', 'missing_error_path', 'untestable'];
  const validSeverities = ['critical', 'warning', 'info'];
  return (
    validTypes.includes(finding.type as string) &&
    validSeverities.includes(finding.severity as string) &&
    typeof finding.description === 'string'
  );
}

/**
 * Create a mock adversary review for testing
 */
export function createMockAdversaryReview(
  featureId: string,
  specId: string,
  findings: AdversaryFinding[] = []
): AdversaryReview {
  const criticalCount = findings.filter((f) => f.severity === 'critical').length;
  return {
    feature_id: featureId,
    spec_id: specId,
    findings,
    approval_recommended: criticalCount === 0,
    confidence_score: Math.max(0, 100 - criticalCount * 30 - findings.filter((f) => f.severity === 'warning').length * 10),
  };
}
