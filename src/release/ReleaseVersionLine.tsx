"use client";

import { formatReleaseLine } from "@/release/format-release";
import {
  getClientReleaseBuild,
  getClientReleaseLabel,
} from "@/release/client-release";

type ReleaseVersionLineProps = {
  className?: string;
  lang?: "ar" | "en";
  showBuild?: boolean;
};

export function ReleaseVersionLine({
  className = "",
  lang = "ar",
  showBuild = false,
}: ReleaseVersionLineProps) {
  const line = formatReleaseLine(
    {
      label: getClientReleaseLabel(),
      build: getClientReleaseBuild(),
    },
    lang,
    { showBuild },
  );

  return (
    <p className={className} dir="ltr">
      {line}
    </p>
  );
}
