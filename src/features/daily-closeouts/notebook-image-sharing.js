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

export async function shareImageThroughSystem({ file, caption = "", title = "", allowFileOnlyFallback = true }) {
  if (!file || typeof navigator === "undefined" || !navigator.share) {
    return { ok: false, method: "unsupported" };
  }
  const captionPayload = {
    files: [file],
    ...(caption ? { text: caption } : {}),
    ...(title ? { title } : {}),
  };
  const payloads = [
    captionPayload,
    ...(allowFileOnlyFallback ? [{ files: [file] }] : []),
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

/**
 * WhatsApp often drops `text` when `files` are attached via Web Share.
 * Open wa.me with the caption first, then copy the image when possible.
 */
export async function shareImageThroughWhatsApp({
  file,
  caption = "",
  title = "",
}) {
  if (!caption && !file) return { ok: false, method: "none" };

  const textCopied = await copyShareCaptionText(caption);
  if (caption) {
    openWhatsAppWithText(caption);
  }

  if (!file) {
    return { ok: Boolean(caption), method: "text-only", copied: textCopied };
  }

  if (navigator.clipboard?.write && typeof ClipboardItem !== "undefined") {
    try {
      const type = file.type || "image/png";
      await navigator.clipboard.write([new ClipboardItem({ [type]: file })]);
      return { ok: true, method: "clipboard", copied: textCopied };
    } catch {
      // fall through to native share sheet for the image only
    }
  }

  const systemShare = await shareImageThroughSystem({
    file,
    caption: "",
    title,
    allowFileOnlyFallback: true,
  });
  if (systemShare.method === "share" || systemShare.method === "abort") {
    return { ok: true, method: systemShare.method, copied: textCopied };
  }

  return { ok: Boolean(caption), method: "text-only", copied: textCopied };
}
