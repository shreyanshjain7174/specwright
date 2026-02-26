/**
 * Component Logger — Phase 6 Observability Layer
 *
 * Structured logging for every tool call, API route, and agent invocation.
 * In development, writes to console.log with colour coding.
 * In production, persists to the audit_log table.
 *
 * Log entry shape:
 * {
 *   timestamp: ISO8601,
 *   level: 'info'|'warn'|'error',
 *   component: string,
 *   action: string,
 *   duration_ms: number,
 *   success: boolean,
 *   metadata: object
 * }
 */

import { getDb } from '@/lib/db';

// ─── TYPES ────────────────────────────────────────────────────────────────────

export type LogLevel = 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: string;       // ISO8601
  level: LogLevel;
  component: string;       // e.g. 'ContextHarvesterAgent', 'POST /api/specs/generate'
  action: string;          // e.g. 'context.harvest', 'spec.generate'
  duration_ms: number;
  success: boolean;
  metadata: Record<string, unknown>;
}

/** Options for persisting a log entry to DB */
interface PersistOptions {
  orgId?: string | null;
  specId?: string | null;
}

// ─── LEVEL COLOURS (dev only) ─────────────────────────────────────────────────

const LEVEL_COLOUR: Record<LogLevel, string> = {
  info:  '\x1b[36m',  // cyan
  warn:  '\x1b[33m',  // yellow
  error: '\x1b[31m',  // red
};
const RESET = '\x1b[0m';

// ─── CORE LOG FUNCTION ────────────────────────────────────────────────────────

/**
 * Emit a structured log entry.
 * - Dev (NODE_ENV !== 'production'): pretty-prints to console.
 * - Prod (NODE_ENV === 'production'): persists to audit_log.
 *
 * @param entry   The log entry to record.
 * @param persist Extra DB options (orgId / specId) — only used in prod.
 */
export async function log(
  entry: LogEntry,
  persist?: PersistOptions,
): Promise<void> {
  if (process.env.NODE_ENV !== 'production') {
    const colour = LEVEL_COLOUR[entry.level];
    const badge  = `${colour}[${entry.level.toUpperCase()}]${RESET}`;
    const status = entry.success ? '✓' : '✗';
    console.log(
      `${badge} ${entry.timestamp} ${status} [${entry.component}] ${entry.action} (${entry.duration_ms}ms)`,
      Object.keys(entry.metadata).length ? entry.metadata : '',
    );
    return;
  }

  // Production: write to audit_log
  try {
    const sql = getDb();
    const id  = crypto.randomUUID();
    await sql`
      INSERT INTO audit_log (id, org_id, spec_id, agent_name, action, reasoning, details, created_at)
      VALUES (
        ${id},
        ${persist?.orgId ?? null},
        ${persist?.specId ?? null},
        ${entry.component},
        ${entry.action},
        ${entry.success ? 'success' : 'failure'},
        ${JSON.stringify({
          level:       entry.level,
          duration_ms: entry.duration_ms,
          success:     entry.success,
          metadata:    entry.metadata,
        })}::jsonb,
        ${entry.timestamp}::timestamptz
      )
    `;
  } catch (err) {
    // Never let logging failures crash the app
    console.error('[Logger] Failed to persist log entry:', err);
  }
}

// ─── CONVENIENCE BUILDERS ─────────────────────────────────────────────────────

/**
 * Create a timed log entry builder.
 * Call start before the operation, then end(success, metadata?) after.
 *
 * @example
 * const timer = createTimer('MyAgent', 'agent.run');
 * try {
 *   const result = await doWork();
 *   await timer.end(true, { result });
 * } catch (err) {
 *   await timer.end(false, { error: String(err) });
 * }
 */
export function createTimer(component: string, action: string) {
  const startMs = Date.now();
  const timestamp = new Date().toISOString();

  return {
    /**
     * Finalize the timer and emit the log entry.
     * @param success   Whether the operation succeeded.
     * @param metadata  Additional context to attach.
     * @param level     Override the log level (defaults to info/error).
     * @param persist   DB options for prod persistence.
     */
    end: (
      success: boolean,
      metadata: Record<string, unknown> = {},
      level?: LogLevel,
      persist?: PersistOptions,
    ): Promise<void> => {
      const duration_ms = Date.now() - startMs;
      const resolvedLevel = level ?? (success ? 'info' : 'error');
      return log({ timestamp, level: resolvedLevel, component, action, duration_ms, success, metadata }, persist);
    },

    /** Read elapsed ms without ending the timer. */
    elapsed: () => Date.now() - startMs,
  };
}

/**
 * Wrap an async function with automatic structured logging.
 *
 * @example
 * const result = await withLogging('MyAgent', 'agent.run', async () => {
 *   return await doWork();
 * });
 */
export async function withLogging<T>(
  component: string,
  action: string,
  fn: () => Promise<T>,
  opts?: { metadata?: Record<string, unknown>; persist?: PersistOptions },
): Promise<T> {
  const timer = createTimer(component, action);
  try {
    const result = await fn();
    await timer.end(true, opts?.metadata ?? {}, 'info', opts?.persist);
    return result;
  } catch (err) {
    await timer.end(
      false,
      { ...(opts?.metadata ?? {}), error: err instanceof Error ? err.message : String(err) },
      'error',
      opts?.persist,
    );
    throw err;
  }
}
