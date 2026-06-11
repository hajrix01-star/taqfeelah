import type { ReleaseMeta } from "@/release/version";

export function formatReleaseBrand(label: string, lang: "ar" | "en" = "ar"): string {
  return lang === "ar" ? `تقفيلة ${label}` : `Taqfeelah ${label}`;
}

export function formatReleaseLine(
  meta: Pick<ReleaseMeta, "label" | "build">,
  lang: "ar" | "en" = "ar",
  options?: { showBuild?: boolean },
): string {
  const brand = formatReleaseBrand(meta.label, lang);
  if (!options?.showBuild || meta.build === "dev") return brand;
  return `${brand} · ${meta.build.slice(0, 8)}`;
}
