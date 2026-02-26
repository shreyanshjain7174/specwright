/**
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  Specwright Demo Seed — Phase 8                                          │
 * │                                                                           │
 * │  Populates the database with 3 complete, realistic product features:      │
 * │                                                                           │
 * │  1. Audit Log Export  (SOC 2 Compliance) — Approved spec, score 92/100   │
 * │  2. SSO Integration   (Enterprise)       — Draft spec, simulation FAILS   │
 * │  3. Dark Mode Toggle  (Simple UI)        — Draft spec, simulation PASSES  │
 * │                                                                           │
 * │  Usage:  npm run seed:demo                                                │
 * └─────────────────────────────────────────────────────────────────────────┘
 */

import { neon } from '@neondatabase/serverless';
import { createHash, randomUUID } from 'crypto';
import dotenv from 'dotenv';

// ─── ENV ──────────────────────────────────────────────────────────────────────
dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('❌  DATABASE_URL is not set. Create a .env or .env.local file.');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

// ─── COLOUR HELPERS ───────────────────────────────────────────────────────────
const C = {
  reset:   '\x1b[0m',
  bold:    '\x1b[1m',
  dim:     '\x1b[2m',
  green:   '\x1b[32m',
  blue:    '\x1b[34m',
  yellow:  '\x1b[33m',
  red:     '\x1b[31m',
  cyan:    '\x1b[36m',
  magenta: '\x1b[35m',
};
const ok   = (s: string) => console.log(`${C.green}  ✓${C.reset} ${s}`);
const step = (s: string) => console.log(`${C.dim}    →${C.reset} ${s}`);
const head = (s: string) => console.log(`\n${C.bold}${C.cyan}${s}${C.reset}`);
const warn = (s: string) => console.log(`${C.yellow}  ⚠${C.reset} ${s}`);

// ─── UTILITIES ────────────────────────────────────────────────────────────────

function sha256(data: string): string {
  return createHash('sha256').update(data).digest('hex');
}

function makeId(prefix: string): string {
  return `${prefix}-${randomUUID()}`;
}

async function upsertFeature(id: string, name: string, description: string): Promise<void> {
  await sql`
    INSERT INTO features (id, name, description)
    VALUES (${id}, ${name}, ${description})
    ON CONFLICT (id) DO UPDATE
      SET name        = EXCLUDED.name,
          description = EXCLUDED.description,
          updated_at  = NOW()
  `;
}

async function insertRawInput(
  id: string,
  featureId: string,
  source: string,
  content: string,
): Promise<void> {
  await sql`
    INSERT INTO raw_inputs (id, feature_id, source, content)
    VALUES (${id}, ${featureId}, ${source}, ${content})
    ON CONFLICT (id) DO NOTHING
  `;
}

async function insertSpec(opts: {
  id: string;
  featureId: string;
  title: string;
  details: object;
  status: 'draft' | 'locked';
  approvedBy?: string;
  contentHash?: string;
  simulationResult?: object;
}): Promise<void> {
  const detailsJson = JSON.stringify({
    ...opts.details,
    simulationResult: opts.simulationResult,
  });

  const contentHash = opts.contentHash ?? sha256(detailsJson);
  const approvedAt  = opts.status === 'locked' ? new Date().toISOString() : null;
  const lockedAt    = opts.status === 'locked' ? new Date().toISOString() : null;

  await sql`
    INSERT INTO specs (id, feature_id, title, details, status, approved_by, approved_at,
                       content_hash, locked_at, updated_at)
    VALUES (
      ${opts.id},
      ${opts.featureId},
      ${opts.title},
      ${detailsJson},
      ${opts.status},
      ${opts.approvedBy ?? null},
      ${approvedAt},
      ${contentHash},
      ${lockedAt},
      NOW()
    )
    ON CONFLICT (id) DO UPDATE
      SET title        = EXCLUDED.title,
          details      = EXCLUDED.details,
          status       = EXCLUDED.status,
          approved_by  = EXCLUDED.approved_by,
          approved_at  = EXCLUDED.approved_at,
          content_hash = EXCLUDED.content_hash,
          locked_at    = EXCLUDED.locked_at,
          updated_at   = NOW()
  `;
}

async function logAudit(opts: {
  agentName: string;
  action: string;
  reasoning: string;
  details: object;
  specId?: string;
}): Promise<void> {
  await sql`
    INSERT INTO audit_log (id, agent_name, action, reasoning, details, spec_id)
    VALUES (
      ${makeId('audit')},
      ${opts.agentName},
      ${opts.action},
      ${opts.reasoning},
      ${JSON.stringify(opts.details)},
      ${opts.specId ?? null}
    )
  `;
}

// ═══════════════════════════════════════════════════════════════════════════════
// FEATURE 1: AUDIT LOG EXPORT — SOC 2 Compliance
// Status: Approved spec  |  Simulation score: 92/100
// ═══════════════════════════════════════════════════════════════════════════════

async function seedAuditLogExport(): Promise<void> {
  head('📋  Feature 1: Audit Log Export (SOC 2 Compliance)');

  const FEATURE_ID = 'feature-audit-log-export';
  const SPEC_ID    = 'spec-audit-log-export-v1';

  step('Creating feature…');
  await upsertFeature(
    FEATURE_ID,
    'Audit Log Export',
    'Export immutable audit logs to CSV for SOC 2 compliance. Required by Acme Corp (P0 churn ' +
    'risk — $480k ARR) before their security audit in 6 weeks. Logs must capture every user ' +
    'action with timestamp, user ID, and IP address — permanently immutable at the database level.',
  );
  ok('Feature created');

  step('Inserting 5 context sources…');

  await insertRawInput(
    'raw-audit-gong-call',
    FEATURE_ID,
    'Gong Call Transcript — Acme Corp Account Review (2024-01-15)',
    `[Gong Call — 2024-01-15 14:30 PST — Account: Acme Corp — CSM: Sarah Chen]

Sarah: "Hey team, I need to flag an urgent situation. Acme Corp is at serious churn risk.
        Their security team came back with a hard blocker after the SSO rollout last week."

Eng: "What exactly did they flag?"

Sarah: "They said they have zero visibility into user actions inside Specwright.
        Their SOC 2 auditors are coming in 6 weeks and they need to show every user action
        with timestamps, user IDs, and IP addresses. This is a hard compliance requirement."

CSO (Acme): "Our CISO is involved now. Without audit logs, we cannot renew the contract.
             We are talking 480k ARR here."

Sarah: "We need this in the product before their audit window closes. P0 blocker for renewal."

[Action item: Engineering to scope audit log export feature immediately]`,
  );

  await insertRawInput(
    'raw-audit-zendesk-ticket',
    FEATURE_ID,
    'Zendesk Ticket #8821 — ENTERPRISE: Acme Corp Audit Log Requirement (P0)',
    `Ticket ID: 8821
Priority: P0 — CHURN BLOCKER
Account: Acme Corp (480k ARR)
Contact: Dave Kowalski <d.kowalski@acmecorp.com>
Created: 2024-01-16 09:14 UTC
Tags: enterprise, compliance, soc2, churn-risk, p0

Subject: ENTERPRISE: Acme Corp audit log requirement

Description:
Our compliance team requires the ability to export audit logs from Specwright
for our upcoming SOC 2 Type II audit. This is a hard requirement.

Specific requirements:
- Export ALL user actions to CSV format
- Columns must include: timestamp (ISO 8601), user_id, user_email, action_type,
  resource_id, resource_type, ip_address, user_agent, session_id
- Must support filtering by: date range, specific user, action type
- Date range filter must support up to 12 months lookback
- Export must be available to admin users only
- Logs must be immutable — our auditors will verify checksums

Timeline: SOC 2 audit window opens in 6 weeks. Blocking contract renewal.`,
  );

  await insertRawInput(
    'raw-audit-slack-thread',
    FEATURE_ID,
    'Slack Thread — #engineering-decisions — Audit Log Architecture (2024-01-16)',
    `#engineering-decisions | 2024-01-16

@sarah.chen [9:02 AM]
  Hey engineers, we need to design the audit log system ASAP. Acme Corp is P0.
  Legal just weighed in — we need immutable design.
  "Logs cannot be modified or deleted by anyone, including admins,
  for a minimum of 30 days after creation."

@jess.eng [9:15 AM]
  Two options: append-only Postgres table with row-level security preventing DELETEs,
  or stream to immutable log store (S3 with Object Lock).

@sarah.chen [9:18 AM]
  Legal preference is append-only database. The simpler the better for auditors.

@jess.eng [9:22 AM]
  OK — append-only table it is. We will use a Postgres trigger to PREVENT deletes.
  Writes must stay under 50ms so we do not slow down user actions.

@sarah.chen [9:33 AM]
  Both admin UI export button AND API endpoint. Acme wants to pipe logs into their SIEM.

@jess.eng [9:45 AM]
  We absolutely cannot expose raw SQL or internal table structure in the export.
  That is a security risk. Clean CSV only.`,
  );

  await insertRawInput(
    'raw-audit-legal-doc',
    FEATURE_ID,
    'Legal Compliance Document — Audit Log Requirements v2.1',
    `SPECWRIGHT PLATFORM — AUDIT LOG COMPLIANCE REQUIREMENTS
Document version: 2.1
Last updated: 2024-01-17
Prepared by: Legal and Compliance Team

1. IMMUTABILITY REQUIREMENTS
   Audit logs MUST be immutable:
   - No record may be deleted for a minimum of 30 days after creation
   - No record may be modified after insertion (no UPDATE operations on log rows)
   - Enforcement must be at the database level, not just application level
   - Exception: administrative purge after 7-year retention period only

2. EXPORT REQUIREMENTS
   Audit logs must be exportable to CSV for external auditors. CSV must include:
   - event_timestamp (ISO 8601 UTC)
   - user_id, user_email (masked: first 2 chars + domain, e.g. jo***@acme.com)
   - action_type (CREATE, READ, UPDATE, DELETE, LOGIN, EXPORT, etc.)
   - resource_type, resource_id
   - ip_address (IPv4 or IPv6)
   - user_agent (full browser/client string)
   - session_id (masked)

3. USER CONTEXT REQUIREMENTS
   Each log entry must capture: IP address, user agent, session identifier.

4. ACCESS CONTROL
   - Only "Admin" or "Compliance Officer" roles may export logs
   - Export actions must themselves be logged (recursive audit)
   - Failed export attempts must be logged

5. PERFORMANCE REQUIREMENTS
   - Log writes must complete under 50ms P99
   - Export for 90-day windows must complete under 60 seconds`,
  );

  await insertRawInput(
    'raw-audit-github-issue',
    FEATURE_ID,
    'GitHub Issue #482 — Audit Logging for SOC 2 Compliance',
    `Issue #482: Audit Logging for SOC 2 Compliance
Repo: specwright/platform
Labels: compliance, enterprise, p0, soc2
Assignees: @jess-eng, @mike-backend
Milestone: Q1 Enterprise Release

Problem: No audit logging. Enterprise customers (financial services, healthcare)
cannot adopt Specwright without SOC 2 compliance. Blocking multiple deals.

Proposed Schema (append-only):
  CREATE TABLE audit_events (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id        TEXT NOT NULL REFERENCES organisations(id),
    user_id       TEXT NOT NULL,
    user_email    TEXT NOT NULL,
    action_type   TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id   TEXT,
    ip_address    INET NOT NULL,
    user_agent    TEXT NOT NULL,
    session_id    TEXT NOT NULL,
    metadata      JSONB DEFAULT '{}',
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  CREATE RULE no_delete_audit AS ON DELETE TO audit_events DO INSTEAD NOTHING;
  CREATE RULE no_update_audit AS ON UPDATE TO audit_events DO INSTEAD NOTHING;

Discussion:
  @jess-eng: Postgres RULE approach is most auditor-friendly — provable at schema level.
  @security-lead: Also consider cryptographic hash chain for tamper-evidence (Phase 2).
  @cto: Ship it. Mark P0. This unlocks enterprise tier.

Acceptance:
  - Append-only audit_events table with RLS
  - CSV export API endpoint (admin only)
  - UI export button in admin settings
  - Filtering by date range, user, action type
  - Write latency under 50ms P99`,
  );

  ok('5 context sources inserted');

  step('Building executable spec…');

  const auditLogSpec = {
    narrative: {
      title: 'Audit Log Export for SOC 2 Compliance',
      objective:
        'Enable admin users to export a complete, immutable audit trail of all user actions ' +
        'to CSV format, supporting filtering by date range, user, and action type — satisfying ' +
        'SOC 2 Type II audit requirements with sub-50ms write latency.',
      rationale:
        'Acme Corp ($480k ARR) is at churn risk due to missing audit logs. Their SOC 2 audit ' +
        'opens in 6 weeks. This feature unblocks contract renewal and positions Specwright for ' +
        'the enterprise compliance market (HIPAA, SOC 2, ISO 27001 accounts).',
    },
    contextPointers: [
      {
        source: 'Gong Call — Acme Corp Account Review (2024-01-15)',
        link: 'gong://calls/acme-corp-2024-01-15',
        snippet: '"SOC 2 auditors coming in 6 weeks — need every user action with timestamps, user IDs, IP addresses. P0 blocker for $480k renewal."',
      },
      {
        source: 'Zendesk Ticket #8821 — P0 Churn Blocker',
        link: 'zendesk://tickets/8821',
        snippet: '"Export ALL user actions to CSV. Filter by date range, user, action type. 12-month lookback. Admin only. Logs must be immutable."',
      },
      {
        source: 'Slack #engineering-decisions (2024-01-16)',
        link: 'slack://C08DEMO123/threads/2024-01-16',
        snippet: '"Append-only Postgres table. PREVENT deletes at DB level. Writes under 50ms. DO NOT expose raw SQL in export."',
      },
      {
        source: 'Legal Compliance Doc v2.1 — Audit Log Requirements',
        link: 'confluence://audit-log-requirements-v2.1',
        snippet: '"Immutable (30-day minimum). CSV with IP address, user agent, session ID. Only Admin/Compliance Officer may export. Recursive audit of export actions."',
      },
      {
        source: 'GitHub Issue #482 — Audit Logging for SOC 2',
        link: 'github://specwright/platform/issues/482',
        snippet: '"Append-only via Postgres RULE. Hash chain for tamper-evidence (Phase 2). CSV export admin-only. Write latency under 50ms P99."',
      },
    ],
    constraints: [
      {
        rule: 'DO NOT delete or update audit log entries — the table must be append-only. Enforce at the database level with Postgres RULEs or row-level security, not just application code.',
        severity: 'critical',
        rationale: 'SOC 2 Type II requires immutable audit evidence. Legal doc v2.1 section 1.',
      },
      {
        rule: 'DO NOT expose raw SQL, internal table names, or database schema in CSV exports. Return a clean, auditor-friendly column set only.',
        severity: 'critical',
        rationale: 'Security requirement from Slack thread (2024-01-16).',
      },
      {
        rule: 'Audit log write latency MUST stay below 50ms at P99 to avoid degrading user-facing response times.',
        severity: 'critical',
        rationale: 'Engineering constraint from Slack thread and Legal doc v2.1 section 5.',
      },
      {
        rule: 'Only users with "Admin" or "Compliance Officer" role may access the export endpoint. Failed access attempts must themselves be logged.',
        severity: 'critical',
        rationale: 'Legal doc v2.1 section 4 access control requirement.',
      },
      {
        rule: 'Export endpoint must support date range filtering with a minimum 12-month lookback window.',
        severity: 'warning',
        rationale: 'Zendesk #8821 — customer needs 12-month history for annual audit cycle.',
      },
      {
        rule: 'CSV export must mask PII: user_email shows only first 2 chars plus domain (e.g., jo***@acme.com).',
        severity: 'warning',
        rationale: 'Legal doc v2.1 section 2 — partial PII protection for shared audit reports.',
      },
    ],
    verification: [
      {
        scenario: 'Admin exports audit logs for a date range as CSV',
        given: [
          'an admin user is authenticated with role "Admin"',
          '50 audit log entries exist between 2024-01-01 and 2024-01-31',
        ],
        when: ['the admin requests GET /api/audit/export?from=2024-01-01&to=2024-01-31&format=csv'],
        then: [
          'the response status is 200 OK',
          'the Content-Type header is "text/csv"',
          'the CSV contains exactly 50 data rows plus 1 header row',
          'the CSV header contains: event_timestamp,user_id,user_email,action_type,resource_type,resource_id,ip_address,user_agent,session_id',
          'each user_email value is masked (first 2 chars visible, rest replaced with asterisks)',
        ],
      },
      {
        scenario: 'Admin filters audit logs by user and action type',
        given: [
          'an admin user is authenticated',
          '100 audit log entries exist; 30 are action_type DELETE by user user-abc123',
        ],
        when: ['the admin requests GET /api/audit/export?user_id=user-abc123&action_type=DELETE'],
        then: [
          'the CSV contains exactly 30 data rows',
          'all rows have action_type equal to DELETE',
          'all rows have user_id equal to user-abc123',
        ],
      },
      {
        scenario: 'Non-admin user is denied access to audit export',
        given: ['a regular user with role "Member" is authenticated'],
        when: ['the user requests GET /api/audit/export'],
        then: [
          'the response status is 403 Forbidden',
          'the response body contains an error field with "Insufficient permissions"',
          'a new audit log entry is created with action_type EXPORT_DENIED',
        ],
      },
      {
        scenario: 'Audit log entries cannot be deleted',
        given: [
          'an audit log entry with id evt-12345 exists',
          'a database admin attempts a direct DELETE query',
        ],
        when: ['DELETE FROM audit_events WHERE id = evt-12345 is executed directly'],
        then: [
          'the query returns 0 rows affected',
          'the entry with id evt-12345 still exists in the database',
          'no application error is thrown (Postgres RULE silently ignores the DELETE)',
        ],
      },
      {
        scenario: 'Audit log write completes within latency budget',
        given: ['a user performs any action such as updating a spec'],
        when: ['the action is processed by the API'],
        then: [
          'an audit log entry is created within 50ms of the action completing',
          'the total request latency increases by no more than 50ms',
          'an audit write failure does NOT cause the original action to fail (fire-and-forget with fallback queue)',
        ],
      },
      {
        scenario: 'CSV export includes all required columns',
        given: ['an audit log entry exists with all fields populated'],
        when: ['the admin exports a CSV containing that entry'],
        then: [
          'the CSV row contains event_timestamp in ISO 8601 UTC format',
          'the CSV row contains user_id as the raw internal ID',
          'the CSV row contains masked user_email',
          'the CSV row contains action_type as one of CREATE, READ, UPDATE, DELETE, LOGIN, LOGOUT, EXPORT, ADMIN',
          'the CSV row contains resource_type and resource_id',
          'the CSV row contains valid IPv4 or IPv6 ip_address',
          'the CSV row contains full user_agent string and session_id',
        ],
      },
      {
        scenario: 'Export action itself is logged in audit trail',
        given: ['an admin user exports audit logs'],
        when: ['the export completes successfully'],
        then: [
          'a new audit log entry is created with action_type EXPORT',
          'the entry records the admin user_id, ip_address, and the filter parameters used',
        ],
      },
      {
        scenario: 'Pagination works for large exports',
        given: ['10000 audit log entries exist in the requested date range'],
        when: ['the admin requests an export with page=2 and page_size=1000'],
        then: [
          'the CSV contains exactly 1000 rows (page 2 of 10)',
          'response headers include X-Total-Count: 10000 and X-Page: 2',
        ],
      },
    ],
  };

  const simulationResult = {
    score: 92,
    passed: true,
    totalScenarios: 8,
    passedScenarios: 8,
    failedScenarios: 0,
    failures: [],
    suggestions: [
      'Consider specifying behavior when audit log export is requested during a database failover (offline mode undefined)',
    ],
    warnings: ['Offline mode behavior undefined — what happens if the audit log write queue fails during export?'],
    blocking_issues: [],
    checks: {
      completeness:  { passed: true, score: 96, issues: [], suggestions: [] },
      ambiguity:     { passed: true, score: 91, issues: [], suggestions: [] },
      contradiction: { passed: true, score: 95, issues: [], suggestions: [] },
      testability:   { passed: true, score: 88, issues: [], suggestions: [] },
    },
    coverageScore: 92,
    simulatedAt: new Date().toISOString(),
  };

  const specDetailsJson = JSON.stringify(auditLogSpec);
  const contentHash = sha256(specDetailsJson);

  await insertSpec({
    id: SPEC_ID,
    featureId: FEATURE_ID,
    title: auditLogSpec.narrative.title,
    details: auditLogSpec,
    status: 'locked',
    approvedBy: 'system-seed',
    contentHash,
    simulationResult,
  });
  ok('Executable spec inserted (status: locked / approved)');

  await logAudit({
    agentName: 'system-seed',
    action: 'spec.approve',
    reasoning: `Demo seed: Audit Log Export spec approved after scoring ${simulationResult.score}/100. All 8 BDD scenarios validated. Content hash: ${contentHash.slice(0, 16)}...`,
    details: {
      specId: SPEC_ID, featureId: FEATURE_ID, simulationScore: simulationResult.score,
      scenarioCount: 8, approvedBy: 'system-seed', contentHash, contextSources: 5,
      note: 'SOC 2 compliance feature — Acme Corp P0 requirement',
    },
    specId: SPEC_ID,
  });
  ok('Audit trail logged');

  console.log(`\n${C.green}  ✅  Feature 1 seeded: Audit Log Export${C.reset}`);
  console.log(`${C.dim}     Spec: ${SPEC_ID} | Status: LOCKED | Score: 92/100${C.reset}`);
}

// ═══════════════════════════════════════════════════════════════════════════════
// FEATURE 2: SSO INTEGRATION — Enterprise Request
// Status: Draft  |  Simulation FAILS (score 58/100) — demonstrates the simulator
// ═══════════════════════════════════════════════════════════════════════════════

async function seedSSOIntegration(): Promise<void> {
  head('🔐  Feature 2: SSO Integration (Enterprise Request)');

  const FEATURE_ID = 'feature-sso-integration';
  const SPEC_ID    = 'spec-sso-integration-v1';

  step('Creating feature…');
  await upsertFeature(
    FEATURE_ID,
    'SSO Integration',
    'Enterprise Single Sign-On via SAML 2.0 and OAuth 2.0 / OpenID Connect. ' +
    'Multiple enterprise prospects require SSO for procurement approval. Currently blocking deals.',
  );
  ok('Feature created');

  step('Inserting 3 context sources…');

  await insertRawInput(
    'raw-sso-customer-email',
    FEATURE_ID,
    'Customer Inquiry Email — TechStart Inc SSO Request (2024-01-22)',
    `From: m.rodriguez@techstart.io
To: sales@specwright.io
Date: 2024-01-22 11:45 UTC
Subject: SSO Support — Procurement Blocker

Hi Specwright team,

We are evaluating Specwright for our engineering org (~120 engineers).
Our IT policy mandates SSO for any SaaS tool we adopt.

We use Okta as our identity provider. Can Specwright support SAML 2.0?

If SSO is not available, this will be a hard blocker for procurement.
Our security team will not approve tools without centralized identity management.

Also interested in:
- Just-In-Time (JIT) provisioning support
- Role mappings in Okta to assign Specwright roles automatically

Miguel Rodriguez
Head of Engineering Platform, TechStart Inc`,
  );

  await insertRawInput(
    'raw-sso-jira-ticket',
    FEATURE_ID,
    'Jira Ticket ENG-291 — Implement OAuth 2.0 + SAML SSO',
    `ENG-291: Implement Enterprise SSO (OAuth 2.0 + SAML 2.0)
Epic: Enterprise Features
Priority: High
Labels: enterprise, authentication, sso, saml, oauth

Description:
Multiple enterprise prospects have flagged SSO as a procurement requirement.
We need to implement SAML 2.0 and OAuth 2.0 / OpenID Connect support.

Scope:
- SAML 2.0 Service Provider (SP) implementation
- OAuth 2.0 Authorization Code Flow with PKCE (RFC 7636)
- OpenID Connect (OIDC) provider support
- Support major IdPs: Okta, Azure AD, Google Workspace, Auth0
- Just-In-Time (JIT) user provisioning on first SSO login
- Role mapping: IdP groups to Specwright roles (Admin, Member, Viewer)
- Admin UI for SSO configuration (metadata URL input)

Acceptance Criteria: TBD (pending design review)

Notes:
- Token handling strategy not yet defined — needs security review
- Need to decide: store tokens in DB or stateless JWT only?`,
  );

  await insertRawInput(
    'raw-sso-security-doc',
    FEATURE_ID,
    'Security Requirements Document — Enterprise Authentication Standards (DRAFT v0.3)',
    `SPECWRIGHT SECURITY REQUIREMENTS — ENTERPRISE SSO
Version: DRAFT 0.3 (not yet approved)
Author: Security Team
Date: 2024-01-25

SUPPORTED PROTOCOLS
The platform must support:
- SAML 2.0 (SP-initiated and IdP-initiated flows)
- OAuth 2.0 Authorization Code Flow with PKCE (RFC 7636)
- OpenID Connect 1.0 (OIDC)

IDENTITY PROVIDER COMPATIBILITY
Must be tested with: Okta, Microsoft Azure AD, Google Workspace, Auth0

SECURITY REQUIREMENTS
[DRAFT — INCOMPLETE SECTION]
Token handling: [TO BE DETERMINED]
  Options:
  a) Store refresh tokens encrypted in database
  b) Stateless short-lived JWTs only (no refresh tokens)
  c) Hybrid: short JWT + server-side session

Session management: [TO BE DETERMINED]

METADATA ENDPOINT
SAML metadata endpoint URL: [NOT SPECIFIED — needs infra decision]`,
  );

  ok('3 context sources inserted');

  step('Building incomplete executable spec (simulator will flag issues)…');

  const ssoSpec = {
    narrative: {
      title: 'SSO Integration via SAML 2.0 and OAuth 2.0',
      objective:
        'Implement enterprise Single Sign-On supporting SAML 2.0 and OAuth 2.0 / OpenID Connect, ' +
        'enabling admin users to configure SSO and employees to authenticate via their company IdP.',
      rationale:
        'Multiple enterprise prospects (TechStart Inc and others) cannot proceed to procurement ' +
        'without SSO. Blocking 3+ deals worth $200k+ ARR.',
    },
    contextPointers: [
      {
        source: 'Customer Inquiry Email — TechStart Inc (2024-01-22)',
        link: 'email://inbox/sso-inquiry-techstart',
        snippet: '"We use Okta. Can Specwright support SAML 2.0? Our IT policy mandates SSO for any SaaS tool."',
      },
      {
        source: 'Jira Ticket ENG-291 — Enterprise SSO Implementation',
        link: 'jira://ENG-291',
        snippet: '"SAML 2.0 SP + OAuth 2.0 PKCE + OIDC. Okta, Azure AD, Google Workspace. JIT provisioning. Token handling: TBD."',
      },
      {
        source: 'Security Requirements Doc v0.3 — Enterprise Auth Standards (DRAFT)',
        link: 'confluence://security-requirements-sso-draft',
        snippet: '"Token handling: TO BE DETERMINED. SAML metadata endpoint: NOT SPECIFIED."',
      },
    ],
    constraints: [
      {
        // INTENTIONALLY VAGUE — simulator catches this
        rule: 'SSO tokens must be handled securely.',
        severity: 'critical',
        rationale: 'Security requirement — token storage strategy is undefined (see security doc section TOKEN HANDLING).',
      },
      {
        rule: 'Support SAML 2.0, OAuth 2.0 with PKCE, and OpenID Connect 1.0.',
        severity: 'critical',
        rationale: 'Security requirements doc v0.3 — all three protocols required for enterprise IdP compatibility.',
      },
      {
        rule: 'IdP-initiated SAML flows must be supported in addition to SP-initiated flows.',
        severity: 'warning',
        rationale: 'Okta defaults to IdP-initiated in many enterprise configurations.',
      },
    ],
    verification: [
      {
        scenario: 'Admin configures Okta SAML 2.0 SSO',
        given: [
          'an admin user is authenticated',
          'the organization does not have SSO configured',
        ],
        when: [
          'the admin navigates to Settings then Security then SSO',
          'the admin enters the Okta SAML metadata URL and clicks Save',
        ],
        then: [
          'the SSO configuration is saved',
          'a confirmation message is shown',
        ],
      },
      {
        scenario: 'Employee logs in via SAML SSO happy path',
        given: [
          'the organization has Okta SAML SSO configured',
          'the employee has a valid Okta account',
        ],
        when: [
          'the employee clicks Login with SSO',
          'the employee authenticates successfully in Okta',
        ],
        then: [
          'the employee is redirected back to Specwright',
          'the employee is logged in and sees the dashboard',
        ],
      },
      // INTENTIONALLY MISSING error paths — simulator flags this
    ],
  };

  const simulationResult = {
    score: 58,
    passed: false,
    totalScenarios: 2,
    passedScenarios: 1,
    failedScenarios: 1,
    failures: [
      {
        scenario: 'Completeness',
        reason: 'Constraint missing: How are tokens stored? "SSO tokens must be handled securely" is not a constraint — it is a wish. Specify storage mechanism: encrypted DB, stateless JWT, or hybrid session.',
      },
      {
        scenario: 'Testability',
        reason: 'Gherkin incomplete: No error path for failed login. What happens when the SAML assertion is invalid, expired, or the IdP is unreachable? Engineers will implement this differently without a spec.',
      },
    ],
    suggestions: [
      'Add a concrete constraint specifying token storage: "Refresh tokens MUST be stored AES-256 encrypted in the database with per-org encryption keys" OR "MUST use stateless short-lived JWTs (15 min) — no server-side storage".',
      'Add Gherkin scenarios for: (1) failed SAML assertion, (2) IdP unreachable, (3) user not in IdP group, (4) token expiry and re-authentication.',
    ],
    warnings: [
      'SAML metadata endpoint URL not specified — where is the SP metadata published? Needed for IdP configuration.',
      'Token refresh strategy undefined — what happens when an SSO session expires?',
    ],
    blocking_issues: [
      'Constraint missing: How are tokens stored?',
      'Gherkin incomplete: No error path for failed login',
    ],
    checks: {
      completeness: {
        passed: false, score: 52,
        issues: ['Vague constraint: "SSO tokens must be handled securely" is not actionable', 'No critical constraint on token storage mechanism'],
        suggestions: ['Replace vague token constraint with specific storage mechanism decision'],
      },
      ambiguity: {
        passed: false, score: 60,
        issues: ['[constraints[0].rule] "handled securely" is ambiguous — multiple valid interpretations exist'],
        suggestions: ['Define "securely" with specific cryptographic standard and storage location'],
      },
      contradiction: { passed: true, score: 75, issues: [], suggestions: [] },
      testability: {
        passed: false, score: 45,
        issues: ['Only happy path covered — no failure scenarios for SAML assertion errors, token expiry, or IdP outage'],
        suggestions: ['Add failed SAML, expired token, and IdP unavailable scenarios'],
      },
    },
    coverageScore: 58,
    simulatedAt: new Date().toISOString(),
  };

  await insertSpec({
    id: SPEC_ID,
    featureId: FEATURE_ID,
    title: ssoSpec.narrative.title,
    details: ssoSpec,
    status: 'draft',
    simulationResult,
  });
  ok('Incomplete spec inserted (status: draft — simulation FAILED)');

  await logAudit({
    agentName: 'PreCodeSimulator',
    action: 'simulator.run',
    reasoning: `Demo seed: SSO Integration spec scored ${simulationResult.score}/100. FAILED — ${simulationResult.blocking_issues.length} blocking issues. Spec returned to PM for revision.`,
    details: {
      specId: SPEC_ID, featureId: FEATURE_ID, simulationScore: simulationResult.score,
      passed: false, blockingIssues: simulationResult.blocking_issues,
      warnings: simulationResult.warnings,
      note: 'Simulator caught missing token storage spec and incomplete error path coverage — prevented ambiguous implementation',
    },
    specId: SPEC_ID,
  });
  ok('Audit trail logged (simulation failure recorded)');

  console.log(`\n${C.yellow}  ⚡  Feature 2 seeded: SSO Integration${C.reset}`);
  console.log(`${C.dim}     Spec: ${SPEC_ID} | Status: DRAFT | Score: 58/100 (FAILED)${C.reset}`);
}

// ═══════════════════════════════════════════════════════════════════════════════
// FEATURE 3: DARK MODE TOGGLE — Simple UI Feature
// Status: Draft  |  Simulation PASSES (score 88/100)
// ═══════════════════════════════════════════════════════════════════════════════

async function seedDarkMode(): Promise<void> {
  head('🌙  Feature 3: Dark Mode Toggle (Simple UI Feature)');

  const FEATURE_ID = 'feature-dark-mode-toggle';
  const SPEC_ID    = 'spec-dark-mode-toggle-v1';

  step('Creating feature…');
  await upsertFeature(
    FEATURE_ID,
    'Dark Mode Toggle',
    "User-facing dark mode toggle in Settings that respects system preference (prefers-color-scheme) " +
    "and persists the user preference in localStorage. Must not break existing tests or accessibility standards.",
  );
  ok('Feature created');

  step('Inserting 2 context sources…');

  await insertRawInput(
    'raw-dark-slack-message',
    FEATURE_ID,
    'Slack Message — #product — Dark Mode User Request (2024-01-19)',
    `#product | 2024-01-19

@mike.pm [2:14 PM]
  Getting a lot of feedback from users asking for dark mode.
  Third most requested feature in our last NPS survey (142 votes).

@design.lead [2:22 PM]
  Key constraint: we should NOT use hardcoded colors anywhere in the implementation.
  Everything via CSS variables or design tokens. Otherwise maintenance nightmare.

@eng.frontend [2:31 PM]
  Agreed. Store the user preference in localStorage. Keep it client-side only,
  no need for a DB column. But we need to not break any existing visual tests.`,
  );

  await insertRawInput(
    'raw-dark-design-spec',
    FEATURE_ID,
    'Design Specification — Dark Mode Toggle v1.0',
    `DARK MODE TOGGLE — DESIGN SPECIFICATION v1.0
Author: Design Lead | Date: 2024-01-23

BEHAVIOR
a) Default: Respect the OS/browser system preference (prefers-color-scheme: dark).
b) User override: Explicitly choose Light, Dark, or System (auto). Persists across reloads.
c) Persistence: Store in localStorage under key "specwright-theme".
   Valid values: "light" | "dark" | "system"
d) Immediate: Theme switches without page reload. No flash of wrong theme on load.

IMPLEMENTATION REQUIREMENTS
- Must NOT use hardcoded color values (hex, rgb, hsl) in any component.
  All colors must reference CSS custom properties defined in tokens.css.
- Must respect the brand color palette as defined in design tokens.
- Must achieve minimum 4.5:1 contrast ratio (WCAG AA) in both themes.
- Must not break any existing Playwright visual regression tests.
- Must not introduce layout shifts — dark mode is a color-only change.

TOGGLE LOCATION
Settings page → Appearance section → "Color Theme" setting.
Options: Light | System (default) | Dark

ACCESSIBILITY
- Keyboard navigable with appropriate ARIA labels.
- Colors must pass WCAG AA contrast in both modes.`,
  );

  ok('2 context sources inserted');

  step('Building executable spec…');

  const darkModeSpec = {
    narrative: {
      title: 'Dark Mode Toggle with System Preference Support',
      objective:
        'Add a user-facing dark/light/system theme toggle to Settings → Appearance that ' +
        'respects the OS color-scheme preference by default, persists the user choice in ' +
        'localStorage, and switches themes instantly without a page reload.',
      rationale:
        'Dark mode is the 3rd most requested feature in the last NPS survey (142 votes). ' +
        'Engineers use Specwright at night — bright backgrounds cause eye strain. ' +
        'This improves retention with zero infrastructure cost (fully client-side).',
    },
    contextPointers: [
      {
        source: 'Slack #product — Dark Mode User Request (2024-01-19)',
        link: 'slack://C08PRODUCT/p2024011914140',
        snippet: '"Third most requested feature (142 NPS votes). Toggle in Settings. DO NOT use hardcoded colors. Store in localStorage. Must not break existing tests."',
      },
      {
        source: 'Design Specification — Dark Mode Toggle v1.0',
        link: 'figma://dark-mode-design-spec-v1',
        snippet: '"Respect prefers-color-scheme by default. localStorage key specwright-theme. 4.5:1 contrast ratio (WCAG AA). Immediate switch — no page reload."',
      },
    ],
    constraints: [
      {
        rule: 'DO NOT use hardcoded color values (hex, rgb, hsl) in any component. All colors must reference CSS custom properties defined in the design token file (tokens.css).',
        severity: 'critical',
        rationale: 'Design spec section 3 — hardcoded colors make future theme changes require full rewrites.',
      },
      {
        rule: 'Theme preference must be stored in localStorage under key "specwright-theme" with values "light" or "dark" or "system". No database column, no API call required.',
        severity: 'critical',
        rationale: 'Design spec section 2c — fully client-side, zero infrastructure cost, works offline.',
      },
      {
        rule: 'Theme must switch immediately on toggle without a full page reload. No flash of wrong theme on initial load (FOUC prevention required).',
        severity: 'critical',
        rationale: 'Design spec section 2d — page reload causes jarring UX.',
      },
      {
        rule: 'Both light and dark themes must achieve WCAG AA minimum 4.5:1 contrast ratio for all text on background.',
        severity: 'warning',
        rationale: 'Design spec section 5 accessibility requirement.',
      },
      {
        rule: 'Respect the brand color palette — do not introduce colors outside approved design tokens.',
        severity: 'warning',
        rationale: 'Slack thread (design.lead) — brand consistency requirement.',
      },
    ],
    verification: [
      {
        scenario: 'User enables dark mode via Settings toggle',
        given: [
          'the user is on the Settings Appearance page',
          'the current theme is Light or System',
        ],
        when: ['the user clicks the Dark option in the Color Theme selector'],
        then: [
          'the page theme switches to dark mode immediately within one animation frame',
          'the localStorage key specwright-theme is set to dark',
          'no page reload occurs',
          'the toggle shows Dark as the selected option',
        ],
      },
      {
        scenario: 'User switches back to light mode',
        given: ['the user has dark mode enabled with localStorage specwright-theme equal to dark'],
        when: ['the user clicks the Light option'],
        then: [
          'the theme switches to light mode immediately',
          'localStorage specwright-theme is set to light',
        ],
      },
      {
        scenario: 'Theme preference persists across page reloads',
        given: ['the user has set their preference to dark'],
        when: ['the user reloads the page'],
        then: [
          'the page loads in dark mode without a flash of light theme',
          'the Settings toggle still shows Dark as selected',
        ],
      },
      {
        scenario: 'System preference is respected by default',
        given: [
          'the user has no stored preference in localStorage',
          'the OS is set to dark mode via prefers-color-scheme: dark',
        ],
        when: ['the user visits Specwright for the first time'],
        then: [
          'the page renders in dark mode',
          'the Settings toggle shows System as selected',
        ],
      },
      {
        scenario: 'Dark mode passes WCAG AA contrast check',
        given: ['dark mode is active'],
        when: ['a contrast audit is run on all text and background color combinations'],
        then: [
          'all body text achieves a contrast ratio of at least 4.5:1 against its background',
          'all UI controls achieve contrast ratio of at least 3:1',
          'no new accessibility violations are introduced and axe-core passes with zero errors',
        ],
      },
    ],
  };

  const simulationResult = {
    score: 88,
    passed: true,
    totalScenarios: 5,
    passedScenarios: 5,
    failedScenarios: 0,
    failures: [],
    suggestions: [
      'Consider adding design tokens to a shared tokens.css file before implementation begins.',
      'Add explicit test for prefers-color-scheme media query change at runtime.',
    ],
    warnings: [
      'Brand color palette should be formally defined in tokens.css before implementation — otherwise engineers will guess.',
      'Accessibility: WCAG AA 4.5:1 contrast ratio must be verified — consider running axe-core in CI.',
    ],
    blocking_issues: [],
    checks: {
      completeness: { passed: true, score: 93, issues: [], suggestions: [] },
      ambiguity: {
        passed: true, score: 88,
        issues: ['[constraints[4].rule] "brand color palette" not formally defined in a shared file yet'],
        suggestions: ['Link to design tokens file or Figma color styles'],
      },
      contradiction: { passed: true, score: 95, issues: [], suggestions: [] },
      testability: {
        passed: true, score: 82,
        issues: [],
        suggestions: ['Add scenario for user changing OS dark mode preference while the app is open'],
      },
    },
    coverageScore: 88,
    simulatedAt: new Date().toISOString(),
  };

  await insertSpec({
    id: SPEC_ID,
    featureId: FEATURE_ID,
    title: darkModeSpec.narrative.title,
    details: darkModeSpec,
    status: 'draft',
    simulationResult,
  });
  ok('Executable spec inserted (status: draft — simulation PASSED)');

  await logAudit({
    agentName: 'PreCodeSimulator',
    action: 'simulator.run',
    reasoning: `Demo seed: Dark Mode Toggle spec scored ${simulationResult.score}/100. PASSED — 0 blocking issues. Minor warnings about design tokens and contrast testing.`,
    details: {
      specId: SPEC_ID, featureId: FEATURE_ID, simulationScore: simulationResult.score,
      passed: true, blockingIssues: [], warnings: simulationResult.warnings,
      note: 'Simple UI feature — clean spec, good coverage, no contradictions',
    },
    specId: SPEC_ID,
  });
  ok('Audit trail logged (simulation pass recorded)');

  console.log(`\n${C.green}  ✅  Feature 3 seeded: Dark Mode Toggle${C.reset}`);
  console.log(`${C.dim}     Spec: ${SPEC_ID} | Status: DRAFT | Score: 88/100 (PASSED)${C.reset}`);
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════════

async function main(): Promise<void> {
  console.log(`\n${C.bold}${C.magenta}╔════════════════════════════════════════════════════════════╗`);
  console.log(`║    Specwright Demo Seed — Phase 8                          ║`);
  console.log(`╚════════════════════════════════════════════════════════════╝${C.reset}`);
  console.log(`\n${C.dim}  Connecting to database…${C.reset}`);

  try {
    const check = await sql`SELECT NOW() as ts`;
    ok(`Database connected (${(check[0] as { ts: string }).ts})`);
  } catch (e) {
    console.error(`${C.red}  ❌  Database connection failed:${C.reset}`, e);
    process.exit(1);
  }

  // Ensure Phase 2 migration columns exist (idempotent)
  head('🔧  Ensuring schema is up to date…');
  const alterStatements = [
    `ALTER TABLE specs ADD COLUMN IF NOT EXISTS title TEXT`,
    `ALTER TABLE specs ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft'`,
    `ALTER TABLE specs ADD COLUMN IF NOT EXISTS approved_by TEXT`,
    `ALTER TABLE specs ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ`,
    `ALTER TABLE specs ADD COLUMN IF NOT EXISTS content_hash TEXT`,
    `ALTER TABLE specs ADD COLUMN IF NOT EXISTS locked_at TIMESTAMPTZ`,
    `ALTER TABLE specs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`,
  ];

  for (const stmt of alterStatements) {
    try {
      await sql.unsafe(stmt);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (!msg.includes('already exists')) warn(`Schema warning: ${msg}`);
    }
  }
  ok('Schema columns verified');

  const startTime = Date.now();

  await seedAuditLogExport();
  await seedSSOIntegration();
  await seedDarkMode();

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log(`\n${C.bold}${C.magenta}╔════════════════════════════════════════════════════════════╗`);
  console.log(`║    ✅  Demo Seed Complete                                  ║`);
  console.log(`╚════════════════════════════════════════════════════════════╝${C.reset}`);
  console.log();
  console.log(`${C.bold}  3 features seeded in ${elapsed}s:${C.reset}`);
  console.log();
  console.log(`  ${C.green}●${C.reset} Audit Log Export   ${C.dim}spec: locked | score: 92/100${C.reset}  ${C.green}✓ Approved${C.reset}`);
  console.log(`  ${C.yellow}●${C.reset} SSO Integration    ${C.dim}spec: draft  | score: 58/100${C.reset}  ${C.red}✗ Sim Failed${C.reset}`);
  console.log(`  ${C.blue}●${C.reset} Dark Mode Toggle   ${C.dim}spec: draft  | score: 88/100${C.reset}  ${C.green}✓ Sim Passed${C.reset}`);
  console.log();
  console.log(`  ${C.dim}→ Open http://localhost:3000/dashboard to see the features${C.reset}`);
  console.log(`  ${C.dim}→ Each feature has context sources, a full spec, and simulation results${C.reset}`);
  console.log();
}

main().catch((e) => {
  console.error('\n❌  Seed failed:', e);
  process.exit(1);
});
