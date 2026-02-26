/**
 * GET /api/specs/[id]/export?format=markdown|json|gherkin
 *
 * Export a spec in one of three formats.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { ExecutableSpec } from '@/lib/types';

type ExportFormat = 'markdown' | 'json' | 'gherkin';

function toMarkdown(spec: ExecutableSpec, meta: { id: string; status: string; approvedBy?: string }): string {
  const lines: string[] = [];
  lines.push(`# ${spec.narrative.title}`);
  lines.push('');
  lines.push(`> **Status:** ${meta.status}${meta.approvedBy ? ` · Approved by: ${meta.approvedBy}` : ''}`);
  lines.push(`> **Spec ID:** \`${meta.id}\``);
  lines.push('');
  lines.push('## Narrative');
  lines.push('');
  lines.push(`**Objective:** ${spec.narrative.objective}`);
  lines.push('');
  lines.push(`**Rationale:** ${spec.narrative.rationale}`);
  lines.push('');

  if (spec.contextPointers?.length > 0) {
    lines.push('## Context Pointers');
    lines.push('');
    for (const ptr of spec.contextPointers) {
      lines.push(`- **${ptr.source}**${ptr.link ? ` ([link](${ptr.link}))` : ''}`);
      lines.push(`  > ${ptr.snippet}`);
      lines.push('');
    }
  }

  if (spec.constraints?.length > 0) {
    lines.push('## Constraints');
    lines.push('');
    for (const c of spec.constraints) {
      const emoji = c.severity === 'critical' ? '🔴' : c.severity === 'warning' ? '🟡' : 'ℹ️';
      lines.push(`### ${emoji} [${c.severity.toUpperCase()}]`);
      lines.push('');
      lines.push(`**Rule:** ${c.rule}`);
      lines.push('');
      lines.push(`**Rationale:** ${c.rationale}`);
      lines.push('');
    }
  }

  if (spec.verification?.length > 0) {
    lines.push('## Verification Scenarios');
    lines.push('');
    for (const s of spec.verification) {
      lines.push(`### ${s.scenario}`);
      lines.push('');
      lines.push('**Given:**');
      for (const g of s.given ?? []) lines.push(`- ${g}`);
      lines.push('');
      lines.push('**When:**');
      for (const w of s.when ?? []) lines.push(`- ${w}`);
      lines.push('');
      lines.push('**Then:**');
      for (const t of s.then ?? []) lines.push(`- ${t}`);
      lines.push('');
    }
  }
  return lines.join('\n');
}

function toGherkin(spec: ExecutableSpec): string {
  const lines: string[] = [];
  lines.push(`Feature: ${spec.narrative.title}`);
  lines.push(`  ${spec.narrative.objective}`);
  lines.push('');
  for (const s of spec.verification ?? []) {
    lines.push(`  Scenario: ${s.scenario}`);
    for (const g of s.given ?? []) lines.push(`    Given ${g}`);
    for (const w of s.when ?? []) lines.push(`    When ${w}`);
    for (const t of s.then ?? []) lines.push(`    Then ${t}`);
    lines.push('');
  }
  return lines.join('\n');
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = params;
  const format = (request.nextUrl.searchParams.get('format') ?? 'json') as ExportFormat;

  if (!['markdown', 'json', 'gherkin'].includes(format)) {
    return NextResponse.json({ error: 'format must be one of: markdown, json, gherkin' }, { status: 400 });
  }

  const sql = getDb();
  const rows = await sql`
    SELECT id, title, details, status, approved_by, approved_at, content_hash
    FROM specs WHERE id = ${id}
  `;

  if (rows.length === 0) {
    return NextResponse.json({ error: 'Spec not found' }, { status: 404 });
  }

  const row = rows[0];
  let spec: ExecutableSpec;
  try { spec = JSON.parse(row.details ?? '{}') as ExecutableSpec; }
  catch { return NextResponse.json({ error: 'Spec data is corrupted' }, { status: 500 }); }

  const meta = { id: row.id, status: row.status ?? 'draft', approvedBy: row.approved_by };

  if (format === 'json') return NextResponse.json({ meta, spec });

  if (format === 'markdown') {
    return new NextResponse(toMarkdown(spec, meta), {
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Content-Disposition': `attachment; filename="spec-${id.slice(0, 8)}.md"`,
      },
    });
  }

  return new NextResponse(toGherkin(spec), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Content-Disposition': `attachment; filename="spec-${id.slice(0, 8)}.feature"`,
    },
  });
}
