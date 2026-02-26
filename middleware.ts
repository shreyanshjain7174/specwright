/**
 * Next.js Middleware — Phase 7 Security Layer
 *
 * Applies two cross-cutting concerns to all API routes:
 *   1. Rate limiting  — enforces per-IP request quotas
 *   2. Namespace isolation — injects org context into every request
 *
 * Order of execution (important):
 *   Rate limit check → Org context injection → Route handler
 *
 * Non-API routes (pages, static assets) are passed through unchanged.
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIp, buildRateLimitHeaders, RateLimitBucket } from '@/lib/security/rate-limiter';
import { getOrgContext, injectOrgHeader } from '@/lib/security/namespace';

// ─── BUCKET ROUTING ───────────────────────────────────────────────────────────

/**
 * Map an API pathname to its rate-limit bucket.
 * Returns null for paths that are not rate-limited.
 */
function getBucket(pathname: string): RateLimitBucket | null {
  if (pathname.startsWith('/api/specs/generate'))  return 'spec.generate';
  if (pathname.startsWith('/api/context/ingest'))  return 'context.ingest';
  if (pathname.startsWith('/api/mcp'))             return 'mcp';
  return null;
}

// ─── MIDDLEWARE ───────────────────────────────────────────────────────────────

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only process API routes
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  const ip     = getClientIp(request.headers);
  const bucket = getBucket(pathname);

  // ── Rate limiting ──────────────────────────────────────────────────────────
  if (bucket) {
    const result = checkRateLimit(ip, bucket);

    if (!result.allowed) {
      const headers = buildRateLimitHeaders(result);
      return new NextResponse(
        JSON.stringify({
          error: 'Too Many Requests',
          message: `Rate limit exceeded. Try again in ${result.retryAfterSeconds} seconds.`,
          retryAfter: result.retryAfterSeconds,
        }),
        {
          status:  429,
          headers: {
            'Content-Type': 'application/json',
            ...headers,
          },
        },
      );
    }
  }

  // ── Namespace isolation — inject resolved org ID ───────────────────────────
  const orgId   = getOrgContext(request);
  const headers = new Headers(request.headers);
  injectOrgHeader(headers, orgId);

  // Forward request with enriched headers
  return NextResponse.next({
    request: { headers },
  });
}

// ─── MATCHER ─────────────────────────────────────────────────────────────────

export const config = {
  matcher: [
    /*
     * Match all API routes.
     * Exclude:
     *   - _next/static (static files)
     *   - _next/image (image optimisation)
     *   - favicon.ico
     */
    '/api/:path*',
  ],
};
