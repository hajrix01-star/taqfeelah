export type ReleaseMeta = {
  version: string;
  label: string;
  build: string;
};

function readReleaseVersion(): string {
  return process.env.RELEASE_VERSION || process.env.NEXT_PUBLIC_RELEASE_VERSION || "0.0.0";
}

function readReleaseLabel(): string {
  return process.env.RELEASE_LABEL || process.env.NEXT_PUBLIC_RELEASE_LABEL || "V0";
}

function readReleaseBuild(): string {
  return process.env.RELEASE_BUILD || process.env.NEXT_PUBLIC_RELEASE_BUILD || "dev";
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
