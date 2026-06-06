type AuthApiEnv = {
  NEXT_PUBLIC_AUTH_API_ENABLED?: string;
  AUTH_DB_CREDENTIALS_ENABLED?: string;
};

/** Client/server gate for shipping real auth UI wiring without disabling prototype access. */
export function isAuthApiEnabled(
  env: AuthApiEnv = process.env as AuthApiEnv,
): boolean {
  return env.NEXT_PUBLIC_AUTH_API_ENABLED === "true";
}

/** When true, login validates against auth_identities before env/runtime fallback. */
export function isAuthDbCredentialsEnabled(
  env: AuthApiEnv = process.env as AuthApiEnv,
): boolean {
  return env.AUTH_DB_CREDENTIALS_ENABLED === "true";
}
