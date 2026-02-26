/**
 * POST /api/specs/simulate
 *
 * Run the pre-code simulator on a spec, then update the DB with results.
 *
 * Body:
 *   spec    - ExecutableSpec object to simulate
 *   specId  - (optional) DB ID of the spec (for updating status and audit log)
 *   orgId   - (optional) Organisation ID
 *
 * Returns:
 *   SimulatorResult including coverageScore, checks, and actionable suggestions
 */

import { NextRequest, NextResponse } from 'next/server';
import { simulateSpec } from '@/lib/simulator';
import { ExecutableSpec } from '@/lib/types';
import { getDb } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { spec, specId, orgId } = body;

    if (!spec) {
      return NextResponse.json({ error: 'spec is required' }, { status: 400 });
    }

    // Validate spec has minimal structure
    if (!spec.narrative || !spec.verification) {
      return NextResponse.json(
        { error: 'spec must have at least narrative and verification layers' },
        { status: 400 },
      );
    }

    // Run the simulator
    const result = await simulateSpec(spec as ExecutableSpec, specId, orgId);

    // If a specId was provided, update the spec's status in the DB
    if (specId) {
      try {
        const sql = getDb();
        // Store simulation results in the spec details
        const existing = await sql`SELECT details FROM specs WHERE id = ${specId}`;
        if (existing.length > 0) {
          let details: Record<string, unknown> = {};
          try { details = JSON.parse(existing[0].details ?? '{}'); } catch { /* ignore */ }
          details.lastSimulation = {
            coverageScore: result.coverageScore,
            passed: result.passed,
            issueCount: result.failures.length,
            runAt: new Date().toISOString(),
          };
          await sql`
            UPDATE specs
            SET details = ${JSON.stringify(details)}, updated_at = NOW()
            WHERE id = ${specId}
          `;
        }
      } catch (dbError) {
        console.error('[/api/specs/simulate] DB update error:', dbError);
        // Non-fatal — continue and return simulation result
      }
    }

    return NextResponse.json({
      success: true,
      result,
      agent: 'PreCodeSimulator',
      message: result.passed
        ? `Spec passed simulation with coverage score ${result.coverageScore}/100`
        : `Spec has ${result.failures.length} issues (coverage: ${result.coverageScore}/100)`,
    });
  } catch (error) {
    console.error('[/api/specs/simulate] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Simulation failed' },
      { status: 500 },
    );
  }
}
