/** Share employee closeout PNG; WhatsApp often drops `text` when `files` are attached. */

function formatDateParts(isoDate, lang) {
  if (!isoDate) return { dateLabel: "", weekdayLabel: "" };
  const parsed = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return { dateLabel: isoDate, weekdayLabel: "" };
  const locale = lang === "ar" ? "ar-SA" : "en-US";
  const dateLabel = new Intl.DateTimeFormat(locale, { year: "numeric", month: "long", day: "numeric" }).format(parsed);
  const weekdayLabel = new Intl.DateTimeFormat(locale, { weekday: "long" }).format(parsed);
  return { dateLabel, weekdayLabel };
}

export function buildEmployeeShareCaption(lang, storeName, employeeName, periodLabel, closeoutDate) {
  const { dateLabel, weekdayLabel } = formatDateParts(closeoutDate, lang);
  const fallbackDate = periodLabel || closeoutDate || "";
  const finalDate = dateLabel || fallbackDate;
  if (lang === "ar") {
    const employeePart = employeeName ? ` بواسطة الموظف ${employeeName}` : "";
    const weekdayPart = weekdayLabel ? ` ويوم ${weekdayLabel}` : "";
    return `تقفيلة محل ${storeName}${employeePart} بتاريخ ${finalDate}${weekdayPart}`;
  }
  const employeePart = employeeName ? ` by employee ${employeeName}` : "";
  const weekdayPart = weekdayLabel ? ` (${weekdayLabel})` : "";
  return `Closeout for ${storeName}${employeePart} on ${finalDate}${weekdayPart}`;
}

async function copyCaption(caption) {
  if (!caption || !navigator.clipboard?.writeText) return false;
  try {
    await navigator.clipboard.writeText(caption);
    return true;
  } catch {
    return false;
  }
}

export async function copyEmployeeShareCaption(caption) {
  return copyCaption(caption);
}

function openWhatsAppWithText(message) {
  window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
}

/**
 * @returns {{ ok: boolean, method: string }}
 */
export async function shareEmployeeCloseoutImage({ file, caption, lang }) {
  if (!file) return { ok: false, method: "none" };

  if (typeof navigator !== "undefined" && navigator.share) {
    const payloads = [
      { files: [file] },
      { files: [file], text: caption, title: lang === "ar" ? "تقفيلتي" : "My closeout" },
    ];
    for (const data of payloads) {
      try {
        if (navigator.canShare && !navigator.canShare(data)) continue;
        await navigator.share(data);
        return { ok: true, method: "share" };
      } catch (error) {
        if (error?.name === "AbortError") return { ok: true, method: "abort" };
      }
    }
    try {
      await navigator.share({ files: [file] });
      return { ok: true, method: "share" };
    } catch (error) {
      if (error?.name === "AbortError") return { ok: true, method: "abort" };
    }
  }

  if (navigator.clipboard?.write && typeof ClipboardItem !== "undefined") {
    try {
      const type = file.type || "image/png";
      await navigator.clipboard.write([new ClipboardItem({ [type]: file })]);
      const copiedCaption = await copyCaption(caption);
      const hint = lang === "ar"
        ? "تم نسخ الصورة — الصقها في محادثة واتساب."
        : "Image copied — paste it in WhatsApp chat.";
      openWhatsAppWithText(copiedCaption ? `${caption}\n\n${hint}` : caption);
      return { ok: true, method: "clipboard", copied: copiedCaption };
    } catch {
      /* fall through */
    }
  }

  const copied = await copyCaption(caption);
  openWhatsAppWithText(caption);
  return { ok: false, method: "text-only", copied };
}
