/**
 * @param {"ar" | "en"} lang
 * @param {"pull" | "release" | "refreshing"} phase
 */
export function pullToRefreshLabel(lang, phase) {
  if (phase === "refreshing") {
    return lang === "ar" ? "جاري التحديث..." : "Refreshing...";
  }
  if (phase === "release") {
    return lang === "ar" ? "أفلت للتحديث" : "Release to refresh";
  }
  return lang === "ar" ? "اسحب للتحديث" : "Pull to refresh";
}
