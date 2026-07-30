import type { NextConfig } from 'next';

// ── Validate required environment variables at build / start time ─────────────
const requiredEnvVars = ['NEXT_PUBLIC_API_URL'] as const;

for (const key of requiredEnvVars) {
  if (!process.env[key]) {
    throw new Error(
      `Missing required environment variable: ${key}\n` +
      `Copy .env.example to .env.local and set all values.`
    );
  }
}

const nextConfig: NextConfig = {
  // Make env vars explicitly available (NEXT_PUBLIC_* are already public,
  // but listing them here documents what the app depends on)
  env: {
    NEXT_PUBLIC_API_URL:     process.env.NEXT_PUBLIC_API_URL!,
    NEXT_PUBLIC_APP_NAME:    process.env.NEXT_PUBLIC_APP_NAME    ?? 'PharmaCare PMS',
    NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION ?? '1.0.0',
  },
};

export default nextConfig;
