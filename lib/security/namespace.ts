/**
 * Namespace Isolation — Phase 7 Security Layer
 *
 * Provides multi-tenant org-scoping for all database queries.
 * Every query that touches tenant data MUST pass through these helpers
 * to prevent cross-tenant data leakage.
 *
 * Usage:
 *   import { getOrgContext, assertOrgScope } from '@/lib/security/namespace';
 *
 *   // In an API route:
 *   const orgId = getOrgContext(request);
 *   assertOrgScope(orgId);
 *
 *   // In a DB query helper:
 *   const chunks = await getChunksForOrg(orgId);
 */

import { NextRequest } from 'next/server';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

/**
 * Demo organisation ID used when no real org is present.
 * Safe for development and unauthenticated demo flows.
 * Never use this in production multi-tenant contexts.
 */
export const DEMO_ORG_ID = 'demo-org-00000000-0000-0000-0000-000000000000';

/** Header name where the org context is carried */
const ORG_HEADER = 'x-org-id';

// ─── ORG CONTEXT EXTRACTION ───────────────────────────────────────────────────

/**
 * Extract the organisation ID from a request.
 *
 * Resolution order:
 *   1. x-org-id request header (set by auth middleware / API gateway)
 *   2. JSON body field orgId (for POST requests — already parsed)
 *   3. DEMO_ORG_ID fallback
 *
 * @param request   The incoming NextRequest.
 * @param bodyOrgId Optional orgId already parsed from the request body.
 * @returns         The resolved organisation ID (never null).
 */
export function getOrgContext(request: NextRequest, bodyOrgId?: string | null): string {
  const headerOrg = request.headers.get(ORG_HEADER);
  if (headerOrg?.trim()) return headerOrg.trim();

  if (bodyOrgId?.trim()) return bodyOrgId.trim();

  return DEMO_ORG_ID;
}

/**
 * Validate that an org ID looks structurally valid.
 * Throws if the value is empty, null, or obviously malformed.
 *
 * This is a defence-in-depth check — real auth/authz is upstream.
 *
 * @param orgId  The org ID to validate.
 * @throws       Error with a safe message if validation fails.
 */
export function assertOrgScope(orgId: string | null | undefined): asserts orgId is string {
  if (!orgId || typeof orgId !== 'string' || !orgId.trim()) {
    throw new Error('Missing or invalid org_id — all queries must be org-scoped');
  }
  // Basic sanity: alphanumeric, hyphens, underscores — max 128 chars
  if (!/^[\w\-]{1,128}$/.test(orgId)) {
    throw new Error(`Invalid org_id format: "${orgId.slice(0, 32)}..."`);
  }
}

// ─── SCOPED QUERY HELPERS ─────────────────────────────────────────────────────

/**
 * Verify that a row returned from the DB actually belongs to the expected org.
 * Call this after fetching a row by primary key to prevent IDOR attacks.
 *
 * @param row       The DB row (must have an org_id column).
 * @param orgId     The expected organisation ID.
 * @param resource  Human-readable resource name for the error message.
 * @throws          Error if org_id does not match.
 */
export function assertRowOwnership(
  row: { org_id?: string | null } | null | undefined,
  orgId: string,
  resource = 'resource',
): void {
  if (!row) {
    throw new Error(`${resource} not found`);
  }
  if (row.org_id && row.org_id !== orgId) {
    // Do NOT reveal which org owns it — generic 404-style message
    throw new Error(`${resource} not found`);
  }
}

// ─── MIDDLEWARE HELPERS ───────────────────────────────────────────────────────

/**
 * Inject the org_id into response headers for observability / debugging.
 * Call from middleware or route handlers.
 *
 * @param headers   A Headers object to mutate.
 * @param orgId     The resolved org ID.
 */
export function injectOrgHeader(headers: Headers, orgId: string): void {
  headers.set('x-resolved-org-id', orgId);
}
