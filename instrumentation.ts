/**
 * Next.js Instrumentation Hook
 *
 * Runs once when the server starts (before any requests are handled).
 * Used to validate environment variables and fail fast if any are missing.
 *
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  // Only validate on the Node.js runtime (not edge)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { validateEnv } = await import('@/lib/env-validation');
    validateEnv();
  }
}
