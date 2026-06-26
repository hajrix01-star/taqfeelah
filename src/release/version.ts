export type ReleaseMeta = {
  version: string;
  label: string;
  build: string;
};

function readReleaseVersion(): string {
  return readRuntimeEnv("RELEASE_VERSION") || readRuntimeEnv("NEXT_PUBLIC_RELEASE_VERSION") || "0.0.0";
}

function readReleaseLabel(): string {
  return readRuntimeEnv("RELEASE_LABEL") || readRuntimeEnv("NEXT_PUBLIC_RELEASE_LABEL") || "V0";
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

export function getReleaseMeta(): ReleaseMeta {
  return {
    version: readReleaseVersion(),
    label: readReleaseLabel(),
    build: readReleaseBuild(),
  };
}
