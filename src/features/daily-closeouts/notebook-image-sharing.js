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

export async function shareImageThroughWhatsApp({
  file,
  caption = "",
  title = "",
}) {
  if (!file) return { ok: false, method: "none" };

  const systemShare = await shareImageThroughSystem({ file, caption, title, allowFileOnlyFallback: false });
  if (systemShare.method === "share" || systemShare.method === "abort") {
    return systemShare;
  }

  if (navigator.clipboard?.write && typeof ClipboardItem !== "undefined") {
    try {
      const type = file.type || "image/png";
      await navigator.clipboard.write([new ClipboardItem({ [type]: file })]);
      openWhatsAppWithText(caption);
      return { ok: true, method: "clipboard", copied: false };
    } catch {
      // fall through to text-only fallback
    }
  }

  openWhatsAppWithText(caption);
  return { ok: false, method: "text-only", copied: false };
}
