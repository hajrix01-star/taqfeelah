export const BROWSER_PERSISTENCE_SCOPES = [
  "prototype-demo",
  "prototype-auth",
  "legacy-settings",
  "ui-preferences",
  "operational-fallback",
  "attachments-fallback",
] as const;

export type BrowserPersistenceScope = (typeof BROWSER_PERSISTENCE_SCOPES)[number];

type BrowserPersistencePolicyOptions = {
  scope?: BrowserPersistenceScope;
  env?: Record<string, string | undefined>;
};

function isProductionModeFromEnv(env: Record<string, string | undefined>) {
  if (env.NEXT_PUBLIC_APP_MODE === "production") return true;
  if (env.NEXT_PUBLIC_APP_MODE === "prototype") return false;
  return env.NODE_ENV === "production";
}

export function isBrowserPersistentStorageAllowed({
  env = process.env,
}: BrowserPersistencePolicyOptions = {}): boolean {
  if (env.NEXT_PUBLIC_DISABLE_BROWSER_PERSISTENCE === "true") return false;
  if (isProductionModeFromEnv(env)) return false;
  return true;
}

export function browserPersistenceBlockedReason(
  options: BrowserPersistencePolicyOptions = {},
): "disabled-by-env" | "production-app-mode" | null {
  const env = options.env || process.env;
  if (env.NEXT_PUBLIC_DISABLE_BROWSER_PERSISTENCE === "true") return "disabled-by-env";
  if (isProductionModeFromEnv(env)) return "production-app-mode";
  return null;
}
