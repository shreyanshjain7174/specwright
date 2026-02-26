/**
 * POST /api/specs/approve
 *
 * Hash & lock a spec with a full audit trail.
 * Once approved, the spec status = 'locked' and cannot be modified.
 *
 * Body:
 *   specId      - DB ID of the spec to approve
 *   approvedBy  - Name/email of the approver
 *   orgId       - (optional) Organisation ID
 *   notes       - (optional) Approval notes
 *
 * Returns:
 *   specId, contentHash, approvedAt, auditLogId
 */

import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { getDb } from '@/lib/db';
import { logToAudit } from '@/lib/agents/base';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { specId, approvedBy, orgId, notes } = body;

    if (!specId) {
      return NextResponse.json({ error: 'specId is required' }, { status: 400 });
    }
    if (!approvedBy) {
      return NextResponse.json({ error: 'approvedBy is required' }, { status: 400 });
    }

    const sql = getDb();

    // Fetch the spec
    const rows = await sql`SELECT id, details, status, title FROM specs WHERE id = ${specId}`;
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Spec not found' }, { status: 404 });
    }

    const spec = rows[0];

    if (spec.status === 'locked') {
      return NextResponse.json(
        { error: 'Spec is already locked and cannot be modified' },
        { status: 409 },
      );
    }

    // Compute SHA-256 hash of the spec content at approval time
    const contentHash = createHash('sha256')
      .update(spec.details ?? '')
      .digest('hex');

    const approvedAt = new Date().toISOString();

    // Lock the spec in the DB
    await sql`
      UPDATE specs
      SET
        status       = 'locked',
        approved_by  = ${approvedBy},
        approved_at  = ${approvedAt},
        content_hash = ${contentHash},
        locked_at    = ${approvedAt},
        updated_at   = NOW()
      WHERE id = ${specId}
    `;

    // Write audit trail
    const auditLogId = await logToAudit({
      agentName: 'ApprovalGate',
      action: 'spec.approve',
      reasoning: `Spec "${spec.title ?? specId}" approved by ${approvedBy}. Content hash: ${contentHash.slice(0, 16)}...`,
      details: {
        specId,
        approvedBy,
        contentHash,
        approvedAt,
        notes: notes ?? null,
        previousStatus: spec.status,
      },
      orgId: orgId ?? null,
      specId,
    });

    return NextResponse.json({
      success: true,
      specId,
      title: spec.title,
      status: 'locked',
      approvedBy,
      approvedAt,
      contentHash,
      auditLogId,
      message: `Spec "${spec.title ?? specId}" has been approved and locked`,
    });
  } catch (error) {
    console.error('[/api/specs/approve] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Approval failed' },
      { status: 500 },
    );
  }
}
