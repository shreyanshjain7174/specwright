/**
 * Ambiguity Detector - flags vague requirements
 */

export interface AmbiguityIssue {
  type: 'ambiguous_term' | 'missing_metric' | 'subjective';
  term: string;
  position: number;
  suggestion: string;
}

// Words that indicate ambiguity in requirements
const AMBIGUOUS_TERMS: Record<string, string> = {
  fast: 'Specify exact response time (e.g., "within 200ms at P99")',
  slow: 'Specify exact threshold',
  quick: 'Specify exact response time',
  simple: 'Define specific simplicity criteria or user task completion rate',
  easy: 'Define measurable usability metric (e.g., "90% of users complete task in <60s")',
  intuitive: 'Define specific UX metric (e.g., "SUS score > 80")',
  good: 'Specify measurable quality criteria',
  better: 'Specify measurable improvement over baseline',
  nice: 'Remove subjective qualifier; add objective criteria',
  scalable: 'Specify exact scale targets (e.g., "handle 10,000 concurrent users")',
  performant: 'Specify measurable performance metrics',
  efficient: 'Specify measurable efficiency criteria',
  secure: 'Specify which security standards (e.g., OWASP Top 10, SOC2)',
  modern: 'Remove subjective term; describe concrete design criteria',
  robust: 'Define error rate and recovery criteria',
  flexible: 'Specify which dimensions of flexibility are required',
};

/**
 * Detect ambiguous terms in a requirement string
 */
export function detectAmbiguity(requirement: string): AmbiguityIssue[] {
  const issues: AmbiguityIssue[] = [];
  const lower = requirement.toLowerCase();

  for (const [term, suggestion] of Object.entries(AMBIGUOUS_TERMS)) {
    const regex = new RegExp(`\\b${term}\\b`, 'gi');
    let match;
    while ((match = regex.exec(lower)) !== null) {
      issues.push({
        type: 'ambiguous_term',
        term: match[0],
        position: match.index,
        suggestion,
      });
    }
  }

  return issues;
}

/**
 * Returns true if a requirement is considered ambiguous
 */
export function isAmbiguous(requirement: string): boolean {
  return detectAmbiguity(requirement).length > 0;
}
