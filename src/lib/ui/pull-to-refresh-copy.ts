import type { DisplayLang } from "@/core/i18n/display-locale";
import type { PullToRefreshPhase } from "@/lib/ui/pull-to-refresh-types";

export function pullToRefreshLabel(lang: DisplayLang | string, phase: PullToRefreshPhase): string {
  if (phase === "refreshing") {
    return lang === "ar" ? "جاري التحديث..." : "Refreshing...";
  }
  if (phase === "release") {
    return lang === "ar" ? "أفلت للتحديث" : "Release to refresh";
  }
  return lang === "ar" ? "اسحب للتحديث" : "Pull to refresh";
}

export function pullToRefreshStatusLabel(
  lang: DisplayLang | string,
  refreshing: boolean,
  releaseReady: boolean,
): string {
  if (refreshing) {
    return lang === "ar" ? "جاري التحديث" : "Refreshing";
  }
  if (releaseReady) {
    return lang === "ar" ? "أفلت للتحديث" : "Release to refresh";
  }
  return lang === "ar" ? "اسحب للتحديث" : "Pull to refresh";
}
