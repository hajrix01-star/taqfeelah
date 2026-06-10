/**
 * Screen-reader only status for pull-to-refresh.
 * @param {"ar" | "en"} lang
 * @param {boolean} refreshing
 * @param {boolean} releaseReady
 */
export function pullToRefreshStatusLabel(lang, refreshing, releaseReady) {
  if (refreshing) {
    return lang === "ar" ? "جاري التحديث" : "Refreshing";
  }
  if (releaseReady) {
    return lang === "ar" ? "أفلت للتحديث" : "Release to refresh";
  }
  return lang === "ar" ? "اسحب للتحديث" : "Pull to refresh";
}
