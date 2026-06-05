function defaultPasteHint(lang) {
  return lang === "ar"
    ? "تم نسخ الصورة — الصقها في محادثة واتساب (اضغط مطولاً في حقل الكتابة)."
    : "Image copied — paste it in WhatsApp chat (long-press the message field).";
}

function openWhatsAppWithText(message) {
  if (typeof window === "undefined") return;
  window.open(`https://wa.me/?text=${encodeURIComponent(message || "")}`, "_blank", "noopener,noreferrer");
}

export async function copyShareCaptionText(caption) {
  if (!caption || !navigator.clipboard?.writeText) return false;
  try {
    await navigator.clipboard.writeText(caption);
    return true;
  } catch {
    return false;
  }
}

export async function shareImageThroughSystem({ file, caption = "", title = "" }) {
  if (!file || typeof navigator === "undefined" || !navigator.share) {
    return { ok: false, method: "unsupported" };
  }
  const payloads = [
    { files: [file] },
    { files: [file], text: caption, ...(title ? { title } : {}) },
  ];
  for (const payload of payloads) {
    try {
      if (navigator.canShare && !navigator.canShare(payload)) continue;
      await navigator.share(payload);
      return { ok: true, method: "share" };
    } catch (error) {
      if (error?.name === "AbortError") return { ok: true, method: "abort" };
    }
  }
  return { ok: false, method: "unsupported" };
}

export async function shareImageThroughWhatsApp({
  file,
  caption = "",
  lang = "ar",
  title = "",
  pasteHint = "",
}) {
  if (!file) return { ok: false, method: "none" };

  const systemShare = await shareImageThroughSystem({ file, caption, title });
  if (systemShare.method === "share" || systemShare.method === "abort") {
    return systemShare;
  }

  if (navigator.clipboard?.write && typeof ClipboardItem !== "undefined") {
    try {
      const type = file.type || "image/png";
      await navigator.clipboard.write([new ClipboardItem({ [type]: file })]);
      const copiedCaption = await copyShareCaptionText(caption);
      const hint = pasteHint || defaultPasteHint(lang);
      const message = copiedCaption ? `${caption}\n\n${hint}` : caption || hint;
      openWhatsAppWithText(message);
      return { ok: true, method: "clipboard", copied: copiedCaption };
    } catch {
      // fall through to text-only fallback
    }
  }

  const copied = await copyShareCaptionText(caption);
  openWhatsAppWithText(caption);
  return { ok: false, method: "text-only", copied };
}
