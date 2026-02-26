/**
 * ReAct Orchestrator
 *
 * Implements a step-by-step ReAct (Reasoning + Acting) loop that coordinates
 * all five specialized agents to produce a complete Executable Specification.
 *
 * Flow:
 *   1. THINK: ContextHarvester gathers context
 *   2. ACT:   SpecDraft writes narrative + context layers
 *   3. ACT:   ConstraintExtractor identifies constraints
 *   4. ACT:   GherkinWriter writes verification scenarios
 *   5. THINK: AdversaryReview red-teams the complete spec
 *   6. RETURN: Complete ExecutableSpec + review results
 */

import { ContextHarvesterAgent, HarvestedContext } from './contextHarvester';
import { SpecDraftAgent } from './specDraft';
import { ConstraintExtractorAgent } from './constraintExtractor';
import { GherkinWriterAgent } from './gherkinWriter';
import { AdversaryReviewAgent, AdversaryReviewResult } from './adversaryReview';
import { AgentStep, logToAudit } from './base';
import { ExecutableSpec } from '@/lib/types';
import { getDb } from '@/lib/db';

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface OrchestratorInput {
  featureName: string;
  /** Raw context string (if not stored in DB) */
  rawContext?: string;
  featureId?: string;
  orgId?: string;
  specId?: string;
}

export interface OrchestratorResult {
  spec: ExecutableSpec;
  review: AdversaryReviewResult;
  /** Trace of every agent step taken */
  steps: AgentStep[];
  /** All audit log IDs generated during this run */
  auditLogIds: string[];
  /** Whether the spec passed adversary review */
  approved: boolean;
}

// ─── PROGRESS CALLBACK ────────────────────────────────────────────────────────

export type ProgressCallback = (step: {
  stepName: string;
  agentName: string;
  status: 'running' | 'done' | 'error';
  message: string;
}) => void;

// ─── ORCHESTRATOR ─────────────────────────────────────────────────────────────

/**
 * Run the full multi-agent pipeline to generate an Executable Spec.
 *
 * @param input    - Feature name, optional raw context, and identifiers
 * @param onProgress - Optional streaming progress callback
 */
export async function runOrchestrator(
  input: OrchestratorInput,
  onProgress?: ProgressCallback,
): Promise<OrchestratorResult> {
  const steps: AgentStep[] = [];
  const auditLogIds: string[] = [];

  // Helper to emit progress
  function progress(
    stepName: string,
    agentName: string,
    status: 'running' | 'done' | 'error',
    message: string,
  ) {
    steps.push({ name: stepName, thought: message, action: agentName, observation: status });
    onProgress?.({ stepName, agentName, status, message });
  }

  // ── Step 1: Context Harvesting ───────────────────────────────────────────
  progress('contextHarvest', 'ContextHarvester', 'running', 'Gathering relevant context...');
  const harvester = new ContextHarvesterAgent();
  const harvestOutput = await harvester.run({
    featureId: input.featureId,
    orgId: input.orgId,
    specId: input.specId,
    context: input.rawContext,
    data: {},
  });
  auditLogIds.push(harvestOutput.auditLogId);
  const harvestedContext = harvestOutput.result as HarvestedContext;
  progress('contextHarvest', 'ContextHarvester', 'done',
    `Harvested ${harvestedContext.contextChunks.length} chunks, ${harvestedContext.keyInsights.length} key insights`);

  // ── Step 2: Spec Draft ───────────────────────────────────────────────────
  progress('specDraft', 'SpecDraft', 'running', 'Writing narrative and context layers...');
  const drafter = new SpecDraftAgent();
  const draftOutput = await drafter.run({
    featureId: input.featureId,
    orgId: input.orgId,
    specId: input.specId,
    context: input.rawContext,
    data: { harvestedContext, featureName: input.featureName },
  });
  auditLogIds.push(draftOutput.auditLogId);
  const draftResult = draftOutput.result as Pick<ExecutableSpec, 'narrative' | 'contextPointers'>;
  progress('specDraft', 'SpecDraft', 'done', `Drafted: "${draftResult.narrative.title}"`);

  // ── Step 3: Constraint Extraction ────────────────────────────────────────
  progress('constraintExtract', 'ConstraintExtractor', 'running', 'Extracting constraints...');
  const extractor = new ConstraintExtractorAgent();
  const constraintOutput = await extractor.run({
    featureId: input.featureId,
    orgId: input.orgId,
    specId: input.specId,
    context: input.rawContext,
    data: { harvestedContext, featureName: input.featureName },
  });
  auditLogIds.push(constraintOutput.auditLogId);
  const constraintResult = constraintOutput.result as Pick<ExecutableSpec, 'constraints'>;
  progress('constraintExtract', 'ConstraintExtractor', 'done',
    `Found ${constraintResult.constraints.length} constraints`);

  // ── Step 4: Gherkin Writing ───────────────────────────────────────────────
  progress('gherkinWrite', 'GherkinWriter', 'running', 'Writing verification scenarios...');
  const gherkinWriter = new GherkinWriterAgent();
  const gherkinOutput = await gherkinWriter.run({
    featureId: input.featureId,
    orgId: input.orgId,
    specId: input.specId,
    context: input.rawContext,
    data: {
      narrative: draftResult.narrative,
      constraints: constraintResult.constraints,
    },
  });
  auditLogIds.push(gherkinOutput.auditLogId);
  const gherkinResult = gherkinOutput.result as Pick<ExecutableSpec, 'verification'>;
  progress('gherkinWrite', 'GherkinWriter', 'done',
    `Wrote ${gherkinResult.verification.length} scenarios`);

  // ── Assemble the complete spec ────────────────────────────────────────────
  const spec: ExecutableSpec = {
    narrative: draftResult.narrative,
    contextPointers: draftResult.contextPointers,
    constraints: constraintResult.constraints,
    verification: gherkinResult.verification,
  };

  // ── Step 5: Adversary Review ──────────────────────────────────────────────
  progress('adversaryReview', 'AdversaryReview', 'running', 'Red-teaming the spec...');
  const adversary = new AdversaryReviewAgent();
  const reviewOutput = await adversary.run({
    featureId: input.featureId,
    orgId: input.orgId,
    specId: input.specId,
    data: { spec },
  });
  auditLogIds.push(reviewOutput.auditLogId);
  const review = reviewOutput.result as AdversaryReviewResult;
  progress('adversaryReview', 'AdversaryReview', review.approved ? 'done' : 'done',
    review.approved
      ? 'Spec approved — no blockers found'
      : `Found ${review.issues.filter(i => i.severity === 'blocker').length} blockers`);

  // ── Orchestrator audit log ────────────────────────────────────────────────
  const orchAuditId = await logToAudit({
    agentName: 'Orchestrator',
    action: 'orchestrator.complete',
    reasoning: `Completed full ReAct pipeline for "${input.featureName}". ${review.approved ? 'Spec approved.' : 'Spec has blockers.'}`,
    details: {
      featureName: input.featureName,
      featureId: input.featureId,
      specLayers: {
        contextPointers: spec.contextPointers.length,
        constraints: spec.constraints.length,
        verification: spec.verification.length,
      },
      reviewApproved: review.approved,
      reviewIssues: review.issues.length,
      childAuditLogIds: auditLogIds,
    },
    orgId: input.orgId,
    specId: input.specId,
  });
  auditLogIds.push(orchAuditId);

  return {
    spec,
    review,
    steps,
    auditLogIds,
    approved: review.approved,
  };
}

// ─── SPEC PERSISTENCE ─────────────────────────────────────────────────────────

/**
 * Persist the orchestrator result to the specs table.
 *
 * @returns The inserted spec's DB id
 */
export async function persistSpec(
  result: OrchestratorResult,
  featureId: string | null = null,
  orgId: string | null = null,
): Promise<string> {
  const sql = getDb();
  const specId = crypto.randomUUID();

  await sql`
    INSERT INTO specs (id, feature_id, org_id, title, details, status, updated_at)
    VALUES (
      ${specId},
      ${featureId},
      ${orgId},
      ${result.spec.narrative.title},
      ${JSON.stringify(result.spec)},
      'draft',
      NOW()
    )
  `;

  // Log the persistence action
  await logToAudit({
    agentName: 'Orchestrator',
    action: 'spec.persist',
    reasoning: `Persisted spec "${result.spec.narrative.title}" to database`,
    details: { specId, featureId, approved: result.approved },
    orgId,
    specId,
  });

  return specId;
}
