type SaasAdminApiEnv = {
  NEXT_PUBLIC_SAAS_ADMIN_ENABLED?: string;
  SAAS_ADMIN_API_ENABLED?: string;
  USAGE_TRACKING_ENABLED?: string;
};

export function isSaasAdminClientEnabled(
  env: SaasAdminApiEnv = process.env as SaasAdminApiEnv,
): boolean {
  return env.NEXT_PUBLIC_SAAS_ADMIN_ENABLED === "true";
}

export function isSaasAdminApiEnabled(
  env: SaasAdminApiEnv = process.env as SaasAdminApiEnv,
): boolean {
  return env.SAAS_ADMIN_API_ENABLED === "true";
}

export function isUsageTrackingEnabled(
  env: SaasAdminApiEnv = process.env as SaasAdminApiEnv,
): boolean {
  return env.USAGE_TRACKING_ENABLED === "true";
}
