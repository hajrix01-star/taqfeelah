export const APP_MODES = ["prototype", "production"] as const;

export type AppMode = (typeof APP_MODES)[number];

function normalizeMode(raw: unknown): AppMode {
  return raw === "production" ? "production" : "prototype";
}

export function readPublicAppMode(): AppMode {
  return normalizeMode(process.env.NEXT_PUBLIC_APP_MODE);
}

export function readServerAppMode(): AppMode {
  return normalizeMode(process.env.APP_MODE || process.env.NEXT_PUBLIC_APP_MODE);
}

export function isProductionAppMode(): boolean {
  return readPublicAppMode() === "production";
}
