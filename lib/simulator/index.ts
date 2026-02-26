/**
 * Pre-Code Simulator
 *
 * Runs a comprehensive set of checks on an Executable Specification BEFORE
 * any code is written. Catches logic errors, ambiguities, and gaps early.
 *
 * Checks performed:
 *   1. Completeness   — Are all four spec layers present and non-empty?
 *   2. Ambiguity      — Are requirements interpretable in multiple ways?
 *   3. Contradiction  — Do constraints conflict with each other or scenarios?
 *   4. Testability    — Can the verification scenarios be automated?
 *
 * Output:
 *   - coverageScore: 0–100 (how complete and solid the spec is)
 *   - Individual check results
 *   - Actionable suggestions
 */

import { ExecutableSpec, SimulationResult } from '@/lib/types';
import { getAIClient, AI_MODEL } from '@/lib/ai';
import { logToAudit } from '@/lib/agents/base';

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface CheckResult {
  passed: boolean;
  score: number;          // 0–100
  issues: string[];
  suggestions: string[];
}

export interface SimulatorResult extends SimulationResult {
  /** 0–100 overall coverage score */
  coverageScore: number;
  /** Breakdown of individual checks */
  checks: {
    completeness: CheckResult;
    ambiguity: CheckResult;
    contradiction: CheckResult;
    testability: CheckResult;
  };
  /** ID of the audit log entry */
  auditLogId?: string;
}

// ─── CHECK 1: COMPLETENESS ────────────────────────────────────────────────────

/**
 * Verify that all four spec layers are present and non-trivially populated.
 */
function checkCompleteness(spec: ExecutableSpec): CheckResult {
  const issues: string[] = [];
  const suggestions: string[] = [];
  let score = 100;

  // Narrative checks
  if (!spec.narrative?.title || spec.narrative.title.length < 5) {
    issues.push('Narrative: title is missing or too short');
    suggestions.push('Add a descriptive title (5+ words) to the narrative layer');
    score -= 15;
  }
  if (!spec.narrative?.objective || spec.narrative.objective.length < 20) {
    issues.push('Narrative: objective is missing or too vague');
    suggestions.push('Write a specific, measurable objective (1 sentence)');
    score -= 15;
  }
  if (!spec.narrative?.rationale || spec.narrative.rationale.length < 20) {
    issues.push('Narrative: rationale is missing');
    suggestions.push('Add a rationale explaining why this feature matters');
    score -= 10;
  }

  // Context pointers
  if (!spec.contextPointers || spec.contextPointers.length === 0) {
    issues.push('Context Pointers: no sources linked');
    suggestions.push('Add at least 2 context pointers linking to source data (Slack, Jira, etc.)');
    score -= 20;
  } else if (spec.contextPointers.length < 2) {
    issues.push('Context Pointers: only 1 source — consider adding more evidence');
    suggestions.push('Add more context pointers to strengthen traceability');
    score -= 5;
  }

  // Constraints
  if (!spec.constraints || spec.constraints.length === 0) {
    issues.push('Constraints: no constraints defined');
    suggestions.push('Add at least 1 critical constraint (what must NOT happen)');
    score -= 20;
  } else {
    const hasCritical = spec.constraints.some(c => c.severity === 'critical');
    if (!hasCritical) {
      issues.push('Constraints: no critical constraints — is there really nothing critical?');
      suggestions.push('Review for security, data integrity, or compliance constraints');
      score -= 10;
    }
  }

  // Verification
  if (!spec.verification || spec.verification.length === 0) {
    issues.push('Verification: no test scenarios defined');
    suggestions.push('Add at least 2 Gherkin scenarios (happy path + failure case)');
    score -= 20;
  } else if (spec.verification.length < 2) {
    issues.push('Verification: only 1 scenario — missing failure/edge case coverage');
    suggestions.push('Add a failure scenario (what happens when something goes wrong?)');
    score -= 10;
  }

  return {
    passed: score >= 60,
    score: Math.max(0, score),
    issues,
    suggestions,
  };
}

// ─── CHECK 2: AMBIGUITY ───────────────────────────────────────────────────────

/**
 * Use LLM to detect ambiguous requirements.
 */
async function checkAmbiguity(spec: ExecutableSpec): Promise<CheckResult> {
  const client = getAIClient();

  const prompt = `You are a code implementation expert. Analyze this Executable Spec for ambiguities that would cause different engineers to implement it differently.

Focus on:
- Vague words (e.g., "fast", "intuitive", "appropriate", "should")
- Undefined scope ("all users" — which users exactly?)
- Missing quantification ("results appear" — within how many ms?)
- Conditional logic without explicit branches

Spec:
${JSON.stringify(spec, null, 2)}

Respond with valid JSON only (no markdown fences):
{
  "ambiguities": [
    {
      "location": "narrative.objective|constraints[0].rule|verification[1].then[0]",
      "text": "The ambiguous text",
      "reason": "Why this is ambiguous",
      "suggestion": "How to make it concrete"
    }
  ],
  "overallAmbiguityLevel": "low|medium|high"
}`;

  try {
    const response = await client.chat.completions.create({
      model: AI_MODEL,
      messages: [
        { role: 'system', content: 'You are an expert code specification reviewer. Output only valid JSON.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 2048,
      temperature: 0.3,
    });

    const raw = response.choices[0]?.message?.content?.trim() ?? '';
    let text = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '');
    const parsed = JSON.parse(text) as {
      ambiguities: Array<{ location: string; text: string; reason: string; suggestion: string }>;
      overallAmbiguityLevel: 'low' | 'medium' | 'high';
    };

    const ambiguities = parsed.ambiguities ?? [];
    const level = parsed.overallAmbiguityLevel ?? 'medium';

    const scoreMap = { low: 90, medium: 60, high: 30 };
    const score = scoreMap[level] ?? 60;

    return {
      passed: level !== 'high',
      score,
      issues: ambiguities.map(a => `[${a.location}] ${a.reason}`),
      suggestions: ambiguities.map(a => a.suggestion),
    };
  } catch {
    return {
      passed: true,
      score: 70,
      issues: ['Ambiguity check could not be completed (AI unavailable)'],
      suggestions: ['Manually review spec for vague language'],
    };
  }
}

// ─── CHECK 3: CONTRADICTION ───────────────────────────────────────────────────

/**
 * Check for contradictions within the spec (constraint vs constraint, or constraint vs scenario).
 */
async function checkContradiction(spec: ExecutableSpec): Promise<CheckResult> {
  const client = getAIClient();

  const prompt = `You are a logical consistency checker. Analyze this spec for contradictions.

Look for:
- Constraints that contradict each other
- Verification scenarios that violate stated constraints
- Objectives that conflict with constraints
- Impossible given/when/then combinations

Spec:
${JSON.stringify(spec, null, 2)}

Respond with valid JSON only:
{
  "contradictions": [
    {
      "itemA": "constraints[0].rule",
      "itemB": "verification[1].then[0]",
      "description": "Why these contradict each other",
      "resolution": "How to resolve this contradiction"
    }
  ],
  "hasContradictions": false
}`;

  try {
    const response = await client.chat.completions.create({
      model: AI_MODEL,
      messages: [
        { role: 'system', content: 'You are a logical consistency expert. Output only valid JSON.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 2048,
      temperature: 0.2,
    });

    const raw = response.choices[0]?.message?.content?.trim() ?? '';
    let text = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '');
    const parsed = JSON.parse(text) as {
      contradictions: Array<{ itemA: string; itemB: string; description: string; resolution: string }>;
      hasContradictions: boolean;
    };

    const contradictions = parsed.contradictions ?? [];
    const score = parsed.hasContradictions ? Math.max(0, 100 - contradictions.length * 25) : 95;

    return {
      passed: !parsed.hasContradictions,
      score,
      issues: contradictions.map(c => `${c.itemA} vs ${c.itemB}: ${c.description}`),
      suggestions: contradictions.map(c => c.resolution),
    };
  } catch {
    return {
      passed: true,
      score: 75,
      issues: ['Contradiction check could not be completed (AI unavailable)'],
      suggestions: ['Manually review spec for conflicting requirements'],
    };
  }
}

// ─── CHECK 4: TESTABILITY ─────────────────────────────────────────────────────

/**
 * Verify that verification scenarios can be automated or measured.
 */
function checkTestability(spec: ExecutableSpec): CheckResult {
  const issues: string[] = [];
  const suggestions: string[] = [];
  let score = 100;

  const vagueWords = /\b(appropriate|intuitive|nice|fast|smooth|reasonable|proper|good|better)\b/gi;
  const unmeasurable = /\b(feel|seems?|looks?|appears?|should be|kind of|sort of)\b/gi;

  for (const [i, scenario] of (spec.verification ?? []).entries()) {
    const thenText = (scenario.then ?? []).join(' ');

    // Check for vague outcome language
    if (vagueWords.test(thenText)) {
      issues.push(`Scenario "${scenario.scenario}": "then" contains vague words (appropriate/intuitive/fast/etc.)`);
      suggestions.push(`Replace vague terms in scenario ${i + 1} with measurable criteria (e.g., "< 200ms" instead of "fast")`);
      score -= 10;
    }

    if (unmeasurable.test(thenText)) {
      issues.push(`Scenario "${scenario.scenario}": "then" contains unmeasurable language`);
      suggestions.push(`Rewrite outcome ${i + 1} to be objectively verifiable`);
      score -= 15;
    }

    // Check for empty given/when/then
    if (!scenario.given?.length || !scenario.when?.length || !scenario.then?.length) {
      issues.push(`Scenario "${scenario.scenario}": missing given, when, or then steps`);
      suggestions.push(`Complete all three steps (given/when/then) for scenario ${i + 1}`);
      score -= 20;
    }
  }

  return {
    passed: score >= 60,
    score: Math.max(0, score),
    issues,
    suggestions,
  };
}

// ─── COVERAGE SCORE ───────────────────────────────────────────────────────────

/**
 * Compute a 0–100 overall coverage score from all check results.
 * Weights: completeness 35%, ambiguity 25%, contradiction 25%, testability 15%
 */
function computeCoverageScore(checks: SimulatorResult['checks']): number {
  const weighted =
    checks.completeness.score * 0.35 +
    checks.ambiguity.score   * 0.25 +
    checks.contradiction.score * 0.25 +
    checks.testability.score  * 0.15;
  return Math.round(Math.min(100, Math.max(0, weighted)));
}

// ─── MAIN SIMULATOR ───────────────────────────────────────────────────────────

/**
 * Run the full pre-code simulation on an Executable Specification.
 *
 * @param spec    - The spec to simulate
 * @param specId  - Optional spec DB ID for audit logging
 * @param orgId   - Optional org ID for audit logging
 */
export async function simulateSpec(
  spec: ExecutableSpec,
  specId?: string,
  orgId?: string,
): Promise<SimulatorResult> {
  // Run all checks (completeness is sync; others are async)
  const [completeness, ambiguity, contradiction, testability] = await Promise.all([
    Promise.resolve(checkCompleteness(spec)),
    checkAmbiguity(spec),
    checkContradiction(spec),
    Promise.resolve(checkTestability(spec)),
  ]);

  const checks = { completeness, ambiguity, contradiction, testability };
  const coverageScore = computeCoverageScore(checks);

  // Aggregate failures for the SimulationResult interface
  const allIssues = [
    ...completeness.issues.map(i => ({ scenario: 'Completeness', reason: i })),
    ...ambiguity.issues.map(i =>   ({ scenario: 'Ambiguity',    reason: i })),
    ...contradiction.issues.map(i => ({ scenario: 'Contradiction', reason: i })),
    ...testability.issues.map(i => ({ scenario: 'Testability',  reason: i })),
  ];

  const allSuggestions = [
    ...completeness.suggestions,
    ...ambiguity.suggestions,
    ...contradiction.suggestions,
    ...testability.suggestions,
  ];

  const passed = allIssues.length === 0 && coverageScore >= 70;
  const totalScenarios = spec.verification?.length ?? 0;

  // Estimate how many scenarios are testable
  const passedScenarios = Math.round(totalScenarios * (testability.score / 100));
  const failedScenarios = totalScenarios - passedScenarios;

  // Audit log
  let auditLogId: string | undefined;
  try {
    auditLogId = await logToAudit({
      agentName: 'PreCodeSimulator',
      action: 'simulator.run',
      reasoning: `Simulated spec: coverageScore=${coverageScore}, passed=${passed}, issues=${allIssues.length}`,
      details: {
        specId,
        coverageScore,
        passed,
        issueCount: allIssues.length,
        checkScores: {
          completeness: completeness.score,
          ambiguity: ambiguity.score,
          contradiction: contradiction.score,
          testability: testability.score,
        },
      },
      orgId: orgId ?? null,
      specId: specId ?? null,
    });
  } catch {
    // Non-fatal — don't fail the simulation because of audit log issues
  }

  return {
    passed,
    totalScenarios,
    passedScenarios,
    failedScenarios,
    failures: allIssues,
    suggestions: allSuggestions,
    coverageScore,
    checks,
    auditLogId,
  };
}
