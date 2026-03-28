const required = [
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'FRONTEND_URL',
] as const;

export function validateEnv(): void {
  const missing = required.filter((key) => !process.env[key] || process.env[key]!.trim() === '');
  if (missing.length > 0) {
    console.error('Missing required environment variables:', missing.join(', '));
    process.exit(1);
  }
}
