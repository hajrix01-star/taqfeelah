import { resolveSupportWhatsAppNumber } from "@/core/config/marketing-support";
import { openWhatsAppShare } from "@/core/whatsapp/share-link";

function openWhatsAppWithText(message) {
  if (typeof window === "undefined") return;
  openWhatsAppShare(message || "", resolveSupportWhatsAppNumber());
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
  const payloads = caption
    ? [captionPayload]
    : [
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
 * Prefer the native share sheet with the image first (mobile WhatsApp flow).
 * Opening wa.me before sharing the file breaks image delivery on many devices.
 *
 * @param {{ file?: File | null, caption?: string, title?: string, allowFileOnlyFallback?: boolean }} params
 * @returns {Promise<{ ok: boolean, method: string, copied?: boolean }>}
 */
export async function shareImageThroughWhatsApp({
  file = null,
  caption = "",
  title = "",
  allowFileOnlyFallback = true,
}) {
  if (!caption && !file) return { ok: false, method: "none" };

  if (!file) {
    const textCopied = await copyShareCaptionText(caption);
    if (caption) openWhatsAppWithText(caption);
    return { ok: Boolean(caption), method: "text-only", copied: textCopied };
  }

  const systemShare = await shareImageThroughSystem({
    file,
    caption,
    title,
    allowFileOnlyFallback: caption ? allowFileOnlyFallback : true,
  });
  if (systemShare.method === "share" || systemShare.method === "abort") {
    return { ok: true, method: systemShare.method, copied: false };
  }

  if (navigator.clipboard?.write && typeof ClipboardItem !== "undefined") {
    try {
      const type = file.type || "image/png";
      await navigator.clipboard.write([new ClipboardItem({ [type]: file })]);
      const textCopied = await copyShareCaptionText(caption);
      if (caption) openWhatsAppWithText(caption);
      return { ok: true, method: "clipboard", copied: textCopied };
    } catch {
      // fall through to text-only fallback
    }
  }

  const textCopied = await copyShareCaptionText(caption);
  if (caption) openWhatsAppWithText(caption);
  return { ok: Boolean(caption), method: "text-only", copied: textCopied };
}
