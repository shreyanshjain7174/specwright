/**
 * Environment validation — fail fast with clear errors
 */

interface EnvConfig {
    DATABASE_URL: string;
    CLOUDFLARE_API_KEY: string;
    PAGEINDEX_API_KEY?: string;
    NEXT_PUBLIC_APP_URL?: string;
}

export function validateEnv(): EnvConfig {
    const errors: string[] = [];

    if (!process.env.DATABASE_URL) {
        errors.push('DATABASE_URL is required (Neon PostgreSQL connection string)');
    }

    if (!process.env.CLOUDFLARE_API_KEY) {
        errors.push('CLOUDFLARE_API_KEY is required (Workers AI Gateway key)');
    }

    if (errors.length > 0) {
        const msg = `\n❌ Missing required environment variables:\n${errors.map((e) => `   • ${e}`).join('\n')}\n\nCopy .env.example to .env and fill in the values.\n`;
        throw new Error(msg);
    }

    return {
        DATABASE_URL: process.env.DATABASE_URL!,
        CLOUDFLARE_API_KEY: process.env.CLOUDFLARE_API_KEY!,
        PAGEINDEX_API_KEY: process.env.PAGEINDEX_API_KEY,
        NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    };
}

/**
 * Get the base URL for internal API calls.
 * Works in Vercel (VERCEL_URL), Docker (NEXT_PUBLIC_APP_URL), and local dev.
 */
export function getBaseUrl(): string {
    if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
    if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
    return 'http://localhost:3000';
}
