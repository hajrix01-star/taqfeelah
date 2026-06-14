export const ALLOWED_ATTACHMENT_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

export function normalizeAttachmentMimeType(raw: string): string {
  return raw.trim().toLowerCase();
}

export function assertAllowedAttachmentMimeType(mimeType: string) {
  if (!ALLOWED_ATTACHMENT_MIME_TYPES.has(mimeType)) {
    throw new Error("Unsupported attachment mime type.");
  }
}

export function attachmentExtensionForMimeType(mimeType: string): string {
  if (mimeType.includes("png")) return "png";
  if (mimeType.includes("webp")) return "webp";
  return "jpg";
}
