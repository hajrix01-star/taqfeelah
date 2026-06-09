export function closeoutRequiredEntryMessage(lang = "ar") {
  return lang === "ar"
    ? "لا يمكن حفظ داخل أو خارج بدون تقفيلة. افتح «تقفيلاتي» أو اختر تقفيلة أولًا."
    : "Income or expense cannot be saved without a closeout. Open My Closeouts and start or select a closeout first.";
}

export function duplicateSummaryBlockedInDbSourceMessage(lang = "ar") {
  return lang === "ar"
    ? "اعتماد الملخص المكرر غير متاح في وضع قاعدة البيانات. أضِف تقفيلة ثانية لنفس اليوم بدلًا من ذلك."
    : "Duplicate summary approval is unavailable in database mode. Submit another closeout for the same day instead.";
}

export function resolveStandaloneEntryBlockedMessage(entriesApiDbSource, lang = "ar") {
  if (!entriesApiDbSource) return null;
  return closeoutRequiredEntryMessage(lang);
}
