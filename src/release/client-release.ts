import { normalizeReleaseLabel } from "@/release/version";

/**
 * Client bundle reads - Next.js only inlines direct `process.env.NEXT_PUBLIC_*` access.
 */

export function getClientReleaseVersion(): string {
  return process.env.NEXT_PUBLIC_RELEASE_VERSION || "0.0.0";
}

export function getClientReleaseLabel(): string {
  return normalizeReleaseLabel(process.env.NEXT_PUBLIC_RELEASE_LABEL || "V0");
}

export function getClientReleaseBuild(): string {
  return process.env.NEXT_PUBLIC_RELEASE_BUILD || "dev";
}
