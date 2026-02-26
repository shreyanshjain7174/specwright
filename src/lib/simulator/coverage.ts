/**
 * Coverage Score Calculator
 * Measures how well a spec covers the requirements
 */

export interface Requirement {
  id: string;
  text: string;
  has_acceptance_criteria: boolean;
  has_source_citation: boolean;
  has_gherkin_test: boolean;
  priority: 'MUST' | 'SHOULD' | 'MAY';
}

export interface CoverageResult {
  score: number; // 0-100
  breakdown: {
    acceptance_criteria_coverage: number;
    source_citation_coverage: number;
    gherkin_test_coverage: number;
    must_requirements_covered: number;
  };
  missing: {
    no_acceptance_criteria: string[];
    no_source_citation: string[];
    no_gherkin_test: string[];
  };
}

/**
 * Calculate coverage score for a set of requirements
 */
export function calculateCoverageScore(requirements: Requirement[]): CoverageResult {
  if (requirements.length === 0) {
    return {
      score: 0,
      breakdown: {
        acceptance_criteria_coverage: 0,
        source_citation_coverage: 0,
        gherkin_test_coverage: 0,
        must_requirements_covered: 0,
      },
      missing: {
        no_acceptance_criteria: [],
        no_source_citation: [],
        no_gherkin_test: [],
      },
    };
  }

  const n = requirements.length;
  const mustReqs = requirements.filter((r) => r.priority === 'MUST');

  const withAC = requirements.filter((r) => r.has_acceptance_criteria);
  const withCitation = requirements.filter((r) => r.has_source_citation);
  const withGherkin = requirements.filter((r) => r.has_gherkin_test);
  const mustCovered = mustReqs.filter((r) => r.has_acceptance_criteria && r.has_gherkin_test);

  const acCoverage = withAC.length / n;
  const citationCoverage = withCitation.length / n;
  const gherkinCoverage = withGherkin.length / n;
  const mustCoverage = mustReqs.length > 0 ? mustCovered.length / mustReqs.length : 1;

  // Weighted score: MUST coverage is most important
  const score = Math.round(
    (acCoverage * 0.25 + citationCoverage * 0.25 + gherkinCoverage * 0.25 + mustCoverage * 0.25) * 100
  );

  return {
    score,
    breakdown: {
      acceptance_criteria_coverage: Math.round(acCoverage * 100),
      source_citation_coverage: Math.round(citationCoverage * 100),
      gherkin_test_coverage: Math.round(gherkinCoverage * 100),
      must_requirements_covered: Math.round(mustCoverage * 100),
    },
    missing: {
      no_acceptance_criteria: requirements.filter((r) => !r.has_acceptance_criteria).map((r) => r.id),
      no_source_citation: requirements.filter((r) => !r.has_source_citation).map((r) => r.id),
      no_gherkin_test: requirements.filter((r) => !r.has_gherkin_test).map((r) => r.id),
    },
  };
}

/**
 * Detect missing error paths in a requirements list
 * Looks for "happy path" requirements that lack corresponding error handling
 */
export function detectMissingErrorPaths(requirements: Requirement[]): string[] {
  const missing: string[] = [];
  for (const req of requirements) {
    const text = req.text.toLowerCase();
    // If it describes an action (login, submit, create, update, delete) without mentioning errors
    const isActionReq = /\b(login|submit|create|update|delete|upload|download|send|pay|checkout)\b/.test(text);
    const hasErrorHandling = /\b(error|fail|invalid|rejected|timeout|exception|unauthorized|forbidden)\b/.test(text);
    if (isActionReq && !hasErrorHandling) {
      missing.push(req.id);
    }
  }
  return missing;
}
