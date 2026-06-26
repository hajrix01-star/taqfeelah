export type ReleaseMeta = {
  version: string;
  label: string;
  build: string;
};

const RELEASE_LABEL_ALIASES: Record<string, string> = {
  "phase-4": "نسخة مرحلة 4",
};

function readReleaseVersion(): string {
  return readRuntimeEnv("RELEASE_VERSION") || readRuntimeEnv("NEXT_PUBLIC_RELEASE_VERSION") || "2.0.0";
}

function readReleaseLabel(): string {
  return normalizeReleaseLabel(readRuntimeEnv("RELEASE_LABEL") || readRuntimeEnv("NEXT_PUBLIC_RELEASE_LABEL") || "V0");
}

function readReleaseBuild(): string {
  return readRuntimeEnv("RELEASE_BUILD") || readRuntimeEnv("NEXT_PUBLIC_RELEASE_BUILD") || "dev";
}

function readRuntimeEnv(name: string): string {
  const value = process.env[name];
  return typeof value === "string" ? value : "";
}

export function releaseLabelFromVersion(version: string): string {
  const major = version.split(".")[0]?.trim();
  return major ? `V${major}` : "V0";
}

export function normalizeReleaseLabel(label: string): string {
  const normalized = label.trim();
  return RELEASE_LABEL_ALIASES[normalized] || normalized;
}

export function getReleaseMeta(): ReleaseMeta {
  return {
    version: readReleaseVersion(),
    label: readReleaseLabel(),
    build: readReleaseBuild(),
  };
}
