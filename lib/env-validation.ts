/**
 * Environment Variable Validation
 *
 * Validates all required environment variables at startup.
 * Fails fast with a clear, actionable error message if anything is missing.
 * Never exposes env var values to client components.
 *
 * Required variables:
 *   DATABASE_URL           — Neon PostgreSQL connection string
 *   CLOUDFLARE_API_KEY     — Cloudflare Workers AI API key (via AI Gateway)
 *
 * Optional variables (warn if missing):
 *   PAGEINDEX_API_KEY      — PageIndex API key for reasoning-based document retrieval
 */

// ─── CONFIGURATION ────────────────────────────────────────────────────────────

interface EnvVarSpec {
  name: string;
  required: boolean;
  description: string;
  /** If set, validates the value against this pattern */
  pattern?: RegExp;
  /** If set, validates that the value starts with this prefix */
  prefix?: string;
}

const ENV_VARS: EnvVarSpec[] = [
  {
    name: 'DATABASE_URL',
    required: true,
    description: 'Neon PostgreSQL connection string',
    prefix: 'postgres',
  },
  {
    name: 'CLOUDFLARE_API_KEY',
    required: true,
    description: 'Cloudflare Workers AI API key (via AI Gateway)',
  },
  {
    name: 'PAGEINDEX_API_KEY',
    required: false,
    description: 'PageIndex API key for reasoning-based document retrieval (https://dash.pageindex.ai/api-keys)',
  },
];

// ─── VALIDATION ───────────────────────────────────────────────────────────────

export interface EnvValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate all environment variable specifications.
 * Returns a result object — does NOT throw.
 * Use validateEnv() for the throwing variant.
 */
export function checkEnv(): EnvValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const spec of ENV_VARS) {
    const value = process.env[spec.name];

    if (!value || !value.trim()) {
      if (spec.required) {
        errors.push(
          `Missing required env var: ${spec.name}\n  → ${spec.description}`,
        );
      } else {
        warnings.push(
          `Missing optional env var: ${spec.name} — ${spec.description} (some features may be unavailable)`,
        );
      }
      continue;
    }

    // Pattern validation
    if (spec.pattern && !spec.pattern.test(value)) {
      errors.push(
        `Invalid format for ${spec.name}: expected pattern ${spec.pattern.toString()}\n  → ${spec.description}`,
      );
    }

    // Prefix validation
    if (spec.prefix && !value.startsWith(spec.prefix)) {
      errors.push(
        `Invalid value for ${spec.name}: expected to start with "${spec.prefix}"\n  → ${spec.description}`,
      );
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Validate environment variables and throw if any required vars are missing.
 * Call this once at server startup (e.g., in layout.tsx or instrumentation.ts).
 *
 * Warnings for optional vars are printed to stderr but do NOT throw.
 *
 * @throws Error with a formatted list of all missing/invalid vars.
 */
export function validateEnv(): void {
  // Only validate on the server — never expose to client bundles
  if (typeof window !== 'undefined') return;

  const result = checkEnv();

  if (result.warnings.length > 0) {
    for (const warn of result.warnings) {
      console.warn(`[EnvValidation] ⚠  ${warn}`);
    }
  }

  if (!result.valid) {
    const lines = [
      '',
      '╔══════════════════════════════════════════════════════════════════╗',
      '║          Specwright — Missing Environment Variables              ║',
      '╚══════════════════════════════════════════════════════════════════╝',
      '',
      'The following required environment variables are missing or invalid:',
      '',
      ...result.errors.map((e) => `  ✗ ${e}`),
      '',
      'Fix: copy .env.example to .env.local and fill in the values.',
      'Docs: SETUP.md → Environment Variables',
      '',
    ];
    throw new Error(lines.join('\n'));
  }
}

/**
 * Type-safe env var accessor for server-side code.
 * Throws if the var is not set (unlike process.env which returns undefined).
 *
 * NEVER use this in client components — Next.js will bundle the value.
 *
 * @param name  The environment variable name.
 * @returns     The value as a non-empty string.
 */
export function requireEnv(name: string): string {
  if (typeof window !== 'undefined') {
    throw new Error(`requireEnv("${name}") called in client component — security violation`);
  }
  const value = process.env[name];
  if (!value?.trim()) {
    throw new Error(`Required environment variable "${name}" is not set`);
  }
  return value;
}
