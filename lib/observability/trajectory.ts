/**
 * Trajectory Tracker — Phase 6 Observability Layer
 *
 * Records the full ReAct trace for every multi-agent run.
 * Each step captures: phase (reason|act|observe), agent, input/output summaries,
 * duration, and optional token counts.
 *
 * Stored in: audit_log table (details column, type='trajectory')
 * Indexed by: session_id for efficient retrieval.
 */

import { getDb } from '@/lib/db';

// ─── TYPES ────────────────────────────────────────────────────────────────────

export type ReActPhase = 'reason' | 'act' | 'observe';

export interface TrajectoryStep {
  step_number: number;
  phase: ReActPhase;
  agent: string;
  input_summary: string;
  output_summary: string;
  duration_ms: number;
  tokens_used?: number;
}

export interface Trajectory {
  session_id: string;
  feature_name?: string;
  org_id?: string | null;
  spec_id?: string | null;
  steps: TrajectoryStep[];
  total_duration_ms: number;
  started_at: string;   // ISO8601
  completed_at: string; // ISO8601
}

// ─── TRAJECTORY BUILDER ───────────────────────────────────────────────────────

/**
 * Incrementally build a trajectory during a multi-agent run.
 * Call addStep() for each ReAct phase, then persist() when done.
 *
 * @example
 * const traj = new TrajectoryBuilder(sessionId, 'My Feature');
 * traj.addStep({ phase: 'reason', agent: 'ContextHarvester', ... });
 * traj.addStep({ phase: 'act',    agent: 'SpecDraft',        ... });
 * const trajectory = await traj.persist({ orgId, specId });
 */
export class TrajectoryBuilder {
  private steps: TrajectoryStep[] = [];
  private startedAt: string;
  private stepStartMs: number = Date.now();

  constructor(
    public readonly sessionId: string,
    private readonly featureName?: string,
  ) {
    this.startedAt = new Date().toISOString();
  }

  /**
   * Mark the start of a new step (captures time for duration calculation).
   */
  beginStep(): void {
    this.stepStartMs = Date.now();
  }

  /**
   * Add a completed step to the trajectory.
   * If duration_ms is not provided, it's measured from the last beginStep() call.
   */
  addStep(step: Omit<TrajectoryStep, 'step_number' | 'duration_ms'> & { duration_ms?: number }): void {
    this.steps.push({
      ...step,
      step_number: this.steps.length + 1,
      duration_ms: step.duration_ms ?? (Date.now() - this.stepStartMs),
    });
    this.stepStartMs = Date.now(); // reset for next step
  }

  /**
   * Finalize and persist the trajectory to audit_log.
   *
   * @returns The audit_log row id for this trajectory.
   */
  async persist(opts: { orgId?: string | null; specId?: string | null } = {}): Promise<string> {
    const completedAt = new Date().toISOString();
    const totalDuration = this.steps.reduce((sum, s) => sum + s.duration_ms, 0);

    const trajectory: Trajectory = {
      session_id:        this.sessionId,
      feature_name:      this.featureName,
      org_id:            opts.orgId ?? null,
      spec_id:           opts.specId ?? null,
      steps:             this.steps,
      total_duration_ms: totalDuration,
      started_at:        this.startedAt,
      completed_at:      completedAt,
    };

    try {
      const sql = getDb();
      const id  = crypto.randomUUID();

      await sql`
        INSERT INTO audit_log (id, org_id, spec_id, agent_name, action, reasoning, details, created_at)
        VALUES (
          ${id},
          ${opts.orgId ?? null},
          ${opts.specId ?? null},
          'Orchestrator',
          'trajectory.complete',
          ${`ReAct trajectory for session ${this.sessionId} — ${this.steps.length} steps, ${totalDuration}ms`},
          ${JSON.stringify({ type: 'trajectory', ...trajectory })}::jsonb,
          ${completedAt}::timestamptz
        )
      `;

      return id;
    } catch (err) {
      console.error('[TrajectoryTracker] Failed to persist trajectory:', err);
      // Return a placeholder so callers don't crash
      return crypto.randomUUID();
    }
  }

  /** Retrieve the current steps without persisting. */
  getSteps(): TrajectoryStep[] {
    return [...this.steps];
  }

  /** Total elapsed ms across all recorded steps. */
  getTotalDurationMs(): number {
    return this.steps.reduce((sum, s) => sum + s.duration_ms, 0);
  }
}

// ─── QUERY HELPERS ────────────────────────────────────────────────────────────

/**
 * Retrieve the full trajectory for a given session_id.
 *
 * @param sessionId  The UUID session identifier used when building the trajectory.
 * @returns The trajectory, or null if not found.
 */
export async function getTrajectory(sessionId: string): Promise<Trajectory | null> {
  try {
    const sql = getDb();
    const rows = await sql`
      SELECT details
      FROM   audit_log
      WHERE  action = 'trajectory.complete'
        AND  details->>'session_id' = ${sessionId}
      ORDER  BY created_at DESC
      LIMIT  1
    `;

    if (!rows.length) return null;
    const data = rows[0].details as Record<string, unknown>;
    // Strip the internal 'type' field before returning
    const { type: _, ...trajectory } = data;
    return trajectory as unknown as Trajectory;
  } catch (err) {
    console.error('[TrajectoryTracker] Failed to fetch trajectory:', err);
    return null;
  }
}

/**
 * List recent trajectories for an organisation.
 *
 * @param orgId  Organisation ID.
 * @param limit  Max number of results (default 20).
 */
export async function listTrajectories(orgId: string, limit = 20): Promise<Trajectory[]> {
  try {
    const sql = getDb();
    const rows = await sql`
      SELECT details
      FROM   audit_log
      WHERE  action = 'trajectory.complete'
        AND  org_id = ${orgId}
      ORDER  BY created_at DESC
      LIMIT  ${limit}
    `;

    return rows.map((r) => {
      const { type: _, ...trajectory } = r.details as Record<string, unknown>;
      return trajectory as unknown as Trajectory;
    });
  } catch (err) {
    console.error('[TrajectoryTracker] Failed to list trajectories:', err);
    return [];
  }
}
