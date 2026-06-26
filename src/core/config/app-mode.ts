export const APP_MODES = ["local", "production"] as const;

export type AppMode = (typeof APP_MODES)[number];

function readExplicitAppMode(raw: unknown): AppMode | null {
  if (raw === "production") return "production";
  if (raw === "local") return "local";
  return null;
}

export function readPublicAppMode(): AppMode {
  const explicitMode = readExplicitAppMode(process.env.NEXT_PUBLIC_APP_MODE);
  if (explicitMode) return explicitMode;
  // In real production builds, default to production to avoid client fallback
  // paths that can re-enable local browser storage as a data source.
  return process.env.NODE_ENV === "production" ? "production" : "local";
}

export function readServerAppMode(): AppMode {
  const explicitMode = readExplicitAppMode(process.env.APP_MODE || process.env.NEXT_PUBLIC_APP_MODE);
  if (explicitMode) return explicitMode;
  return process.env.NODE_ENV === "production" ? "production" : "local";
}

export function isProductionAppMode(): boolean {
  return readPublicAppMode() === "production";
}
