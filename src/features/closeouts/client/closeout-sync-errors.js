/**
 * Map server/API closeout sync errors to user-facing copy.
 * @param {unknown} error
 * @param {"ar" | "en"} [lang]
 */
export function mapCloseoutSyncErrorToUserMessage(error, lang = "ar") {
  const message = error instanceof Error ? error.message.trim() : "";
  if (!message) {
    return lang === "ar"
      ? "تعذر تحديث التقفيلات من الخادم."
      : "Failed to refresh closeouts from server.";
  }

  if (message === "Store is not accessible for this organization.") {
    return lang === "ar"
      ? "تعذر الوصول لأحد المحلات على السيرفر. تحقق من ربط المحلات أو احفظ بيانات المحل من الإعدادات."
      : message;
  }

  if (message === "Archived stores cannot accept new entries.") {
    return lang === "ar"
      ? "المحلات المؤرشفة للعرض فقط ولا تقبل إدخالات جديدة."
      : message;
  }

  if (message === "Closeout date cannot be in the future.") {
    return lang === "ar"
      ? "تعذر إرسال التقفيلة: التاريخ المختار غير مقبول. اختر تاريخ اليوم أو يومًا سابقًا."
      : message;
  }

  if (message === "Invalid closeout attachment payload.") {
    return lang === "ar"
      ? "تعذر إرسال التقفيلة: مرفق الصورة غير صالح. أزل الصورة وأضفها من جديد."
      : message;
  }

  return message;
}
