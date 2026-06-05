export const APP_MODES = ["prototype", "production"] as const;

export type AppMode = (typeof APP_MODES)[number];

function normalizeMode(raw: unknown): AppMode {
  return raw === "production" ? "production" : "prototype";
}

export function readPublicAppMode(): AppMode {
  const explicitMode = normalizeMode(process.env.NEXT_PUBLIC_APP_MODE);
  if (explicitMode === "production") return "production";
  // In real production builds, default to production to avoid client fallback
  // paths that can re-enable local prototype storage as a data source.
  return process.env.NODE_ENV === "production" ? "production" : "prototype";
}

export function readServerAppMode(): AppMode {
  const explicitMode = normalizeMode(process.env.APP_MODE || process.env.NEXT_PUBLIC_APP_MODE);
  if (explicitMode === "production") return "production";
  return process.env.NODE_ENV === "production" ? "production" : "prototype";
}

export function isProductionAppMode(): boolean {
  return readPublicAppMode() === "production";
}
