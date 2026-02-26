/**
 * Rate Limiter — Phase 7 Security Layer
 *
 * In-memory sliding-window rate limiter per IP address.
 * Redis backend is planned for Phase 8 (horizontal scaling).
 *
 * Configured limits:
 *   POST /api/specs/generate   — 10  req/hour per IP
 *   POST /api/context/ingest   — 100 req/hour per IP
 *   /api/mcp/*                 — 1000 req/hour per IP
 *
 * Returns 429 with Retry-After header when limit is exceeded.
 *
 * Usage in a route handler:
 *   import { checkRateLimit } from '@/lib/security/rate-limiter';
 *   const result = checkRateLimit(ip, 'spec.generate');
 *   if (!result.allowed) {
 *     return new Response('Too Many Requests', {
 *       status: 429,
 *       headers: { 'Retry-After': String(result.retryAfterSeconds) }
 *     });
 *   }
 */

// ─── TYPES ────────────────────────────────────────────────────────────────────

export type RateLimitBucket =
  | 'spec.generate'
  | 'context.ingest'
  | 'mcp';

interface BucketConfig {
  /** Maximum requests allowed in the window */
  limit: number;
  /** Window size in milliseconds */
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAtMs: number;
  /** Seconds until the client may retry (only meaningful when !allowed) */
  retryAfterSeconds: number;
}

// ─── CONFIGURATION ────────────────────────────────────────────────────────────

const BUCKET_CONFIG: Record<RateLimitBucket, BucketConfig> = {
  'spec.generate':  { limit: 10,   windowMs: 60 * 60 * 1000 },  // 10/hr
  'context.ingest': { limit: 100,  windowMs: 60 * 60 * 1000 },  // 100/hr
  'mcp':            { limit: 1000, windowMs: 60 * 60 * 1000 },  // 1000/hr
};

// ─── STORE ────────────────────────────────────────────────────────────────────

/** Timestamped request log per (ip:bucket) key */
const store = new Map<string, number[]>();

/** How often to sweep expired entries (every 5 minutes) */
const SWEEP_INTERVAL_MS = 5 * 60 * 1000;

/**
 * Periodically purge stale entries to prevent unbounded memory growth.
 * Only runs in Node.js environments (not edge runtime).
 */
function scheduleSweep(): void {
  if (typeof setInterval === 'undefined') return;
  setInterval(() => {
    const now = Date.now();
    for (const [key, timestamps] of store.entries()) {
      // Determine max window for this bucket
      const bucket = key.split(':')[1] as RateLimitBucket;
      const cfg    = BUCKET_CONFIG[bucket];
      if (!cfg) { store.delete(key); continue; }

      const cutoff = now - cfg.windowMs;
      const fresh  = timestamps.filter((t) => t > cutoff);
      if (fresh.length === 0) {
        store.delete(key);
      } else {
        store.set(key, fresh);
      }
    }
  }, SWEEP_INTERVAL_MS).unref?.();
}

scheduleSweep();

// ─── CORE FUNCTION ────────────────────────────────────────────────────────────

/**
 * Check whether a request from `ip` is within the rate limit for `bucket`.
 * Records the request if allowed.
 *
 * @param ip      Client IP address (from request headers).
 * @param bucket  The rate-limit bucket to check.
 * @returns       RateLimitResult with allowed/remaining/reset info.
 */
export function checkRateLimit(ip: string, bucket: RateLimitBucket): RateLimitResult {
  const cfg = BUCKET_CONFIG[bucket];
  if (!cfg) {
    // Unknown bucket — allow by default but warn
    console.warn(`[RateLimiter] Unknown bucket: ${bucket}`);
    return { allowed: true, remaining: Infinity, resetAtMs: 0, retryAfterSeconds: 0 };
  }

  const key     = `${ip}:${bucket}`;
  const now     = Date.now();
  const cutoff  = now - cfg.windowMs;

  // Get existing timestamps and drop those outside the window
  const existing = (store.get(key) ?? []).filter((t) => t > cutoff);

  if (existing.length >= cfg.limit) {
    // Rate limit exceeded — find the oldest timestamp to compute retry delay
    const oldestInWindow = existing[0];
    const resetAtMs      = oldestInWindow + cfg.windowMs;
    const retryAfterSeconds = Math.ceil((resetAtMs - now) / 1000);

    return {
      allowed:           false,
      remaining:         0,
      resetAtMs,
      retryAfterSeconds: Math.max(1, retryAfterSeconds),
    };
  }

  // Allow: record this request
  existing.push(now);
  store.set(key, existing);

  const resetAtMs = existing[0] + cfg.windowMs;
  return {
    allowed:           true,
    remaining:         cfg.limit - existing.length,
    resetAtMs,
    retryAfterSeconds: 0,
  };
}

/**
 * Extract the client IP from a NextRequest.
 * Checks standard proxy headers in priority order.
 *
 * @param headers  The request Headers object.
 * @returns        IP string, or '127.0.0.1' fallback.
 */
export function getClientIp(headers: Headers): string {
  return (
    headers.get('x-real-ip') ??
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    headers.get('cf-connecting-ip') ??
    '127.0.0.1'
  );
}

/**
 * Build the standard 429 response headers.
 *
 * @param result  The RateLimitResult from checkRateLimit.
 * @returns       Headers object ready to attach to the response.
 */
export function buildRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'Retry-After':          String(result.retryAfterSeconds),
    'X-RateLimit-Reset':    String(Math.floor(result.resetAtMs / 1000)),
    'X-RateLimit-Remaining': String(result.remaining),
  };
}
