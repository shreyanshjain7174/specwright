/**
 * Outcome Evaluator — Phase 6 Observability Layer
 *
 * Calculates multi-dimensional quality scores for every generated spec:
 *
 *   completeness_score  — 0-100, structural completeness
 *   grounding_score     — % of context pointers with citations
 *   testability_score   — % of verification scenarios with full Gherkin
 *   adversarial_score   — issues resolved by adversary review
 *   overall_score       — weighted average
 *
 * Scores are persisted to the specs table via the migration
 * drizzle/migrations/0002_add_privacy_level.sql (which also adds score columns).
 */

import { getDb } from '@/lib/db';
import { ExecutableSpec } from '@/lib/types';
import { AdversaryReviewResult } from '@/lib/agents/adversaryReview';

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface SpecQualityScores {
  /** 0-100: how completely the spec fills all required sections */
  completeness_score: number;
  /** 0-100: percentage of context pointers that have source citations */
  grounding_score: number;
  /** 0-100: percentage of verification scenarios with complete Given/When/Then */
  testability_score: number;
  /** 0-100: adversary review issues resolved (100 = no blockers found) */
  adversarial_score: number;
  /** 0-100: weighted average of all four dimensions */
  overall_score: number;
}

/** Weights for overall_score calculation — must sum to 1.0 */
const WEIGHTS = {
  completeness:  0.30,
  grounding:     0.25,
  testability:   0.25,
  adversarial:   0.20,
} as const;

// ─── SCORING FUNCTIONS ────────────────────────────────────────────────────────

/**
 * Score structural completeness (0-100).
 *
 * Checks that all required sections are present and non-empty:
 *   narrative (title, objective, rationale), contextPointers, constraints, verification
 */
function scoreCompleteness(spec: ExecutableSpec): number {
  let earned = 0;
  const total = 100;

  // Narrative fields: 40 pts
  if (spec.narrative?.title?.trim())     earned += 14;
  if (spec.narrative?.objective?.trim()) earned += 13;
  if (spec.narrative?.rationale?.trim()) earned += 13;

  // Context pointers: 20 pts (full credit for ≥3)
  const cpCount = spec.contextPointers?.length ?? 0;
  earned += Math.min(cpCount / 3, 1) * 20;

  // Constraints: 20 pts (full credit for ≥2)
  const conCount = spec.constraints?.length ?? 0;
  earned += Math.min(conCount / 2, 1) * 20;

  // Verification scenarios: 20 pts (full credit for ≥3)
  const verCount = spec.verification?.length ?? 0;
  earned += Math.min(verCount / 3, 1) * 20;

  return Math.round(Math.min(earned, total));
}

/**
 * Score context grounding (0-100).
 *
 * Percentage of context pointers that have a non-empty source and snippet.
 */
function scoreGrounding(spec: ExecutableSpec): number {
  const pointers = spec.contextPointers ?? [];
  if (pointers.length === 0) return 0;

  const cited = pointers.filter(
    (p) => p.source?.trim() && p.snippet?.trim(),
  ).length;

  return Math.round((cited / pointers.length) * 100);
}

/**
 * Score testability (0-100).
 *
 * Percentage of verification scenarios with at least one Given, one When,
 * and one Then step defined.
 */
function scoreTestability(spec: ExecutableSpec): number {
  const scenarios = spec.verification ?? [];
  if (scenarios.length === 0) return 0;

  const complete = scenarios.filter(
    (s) =>
      s.given?.length  > 0 &&
      s.when?.length   > 0 &&
      s.then?.length   > 0 &&
      s.scenario?.trim(),
  ).length;

  return Math.round((complete / scenarios.length) * 100);
}

/**
 * Score adversarial review quality (0-100).
 *
 * 100 = approved with no issues.
 * Deducted by blockers (−20 each) and warnings (−5 each), floored at 0.
 */
function scoreAdversarial(review: AdversaryReviewResult): number {
  if (review.approved && review.issues.length === 0) return 100;

  const blockers = review.issues.filter((i) => i.severity === 'blocker').length;
  const warnings = review.issues.filter((i) => i.severity === 'warning').length;

  const deduction = blockers * 20 + warnings * 5;
  return Math.max(0, 100 - deduction);
}

// ─── PUBLIC API ───────────────────────────────────────────────────────────────

/**
 * Evaluate a generated spec and return quality scores.
 *
 * @param spec    The ExecutableSpec to evaluate.
 * @param review  The AdversaryReviewResult from the review agent.
 * @returns       SpecQualityScores with all five dimensions.
 */
export function evaluateSpec(
  spec: ExecutableSpec,
  review: AdversaryReviewResult,
): SpecQualityScores {
  const completeness_score  = scoreCompleteness(spec);
  const grounding_score     = scoreGrounding(spec);
  const testability_score   = scoreTestability(spec);
  const adversarial_score   = scoreAdversarial(review);

  const overall_score = Math.round(
    completeness_score  * WEIGHTS.completeness  +
    grounding_score     * WEIGHTS.grounding     +
    testability_score   * WEIGHTS.testability   +
    adversarial_score   * WEIGHTS.adversarial,
  );

  return {
    completeness_score,
    grounding_score,
    testability_score,
    adversarial_score,
    overall_score,
  };
}

/**
 * Persist quality scores to the specs table.
 * Requires the score columns added by migration 0002.
 *
 * @param specId  The spec row to update.
 * @param scores  The scores to persist.
 */
export async function persistScores(
  specId: string,
  scores: SpecQualityScores,
): Promise<void> {
  try {
    const sql = getDb();
    await sql`
      UPDATE specs
      SET
        completeness_score  = ${scores.completeness_score},
        grounding_score     = ${scores.grounding_score},
        testability_score   = ${scores.testability_score},
        adversarial_score   = ${scores.adversarial_score},
        overall_score       = ${scores.overall_score},
        updated_at          = NOW()
      WHERE id = ${specId}
    `;
  } catch (err) {
    console.error('[OutcomeEvaluator] Failed to persist scores:', err);
  }
}

/**
 * Evaluate a spec AND immediately persist the scores.
 * Convenience wrapper combining evaluateSpec + persistScores.
 *
 * @returns The computed scores (also persisted to DB).
 */
export async function evaluateAndPersist(
  specId: string,
  spec: ExecutableSpec,
  review: AdversaryReviewResult,
): Promise<SpecQualityScores> {
  const scores = evaluateSpec(spec, review);
  await persistScores(specId, scores);
  return scores;
}
