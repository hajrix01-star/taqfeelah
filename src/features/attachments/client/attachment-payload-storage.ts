import {
  safeDeleteIndexedDbValue,
  safeGetIndexedDbValue,
  safePutIndexedDbValue,
} from "@/core/client/safe-indexed-db";
import type { OperationalEntry } from "@/features/entries/client/entries-client-types";
import type { PreparedAttachment, StoredAttachmentPayload } from "@/features/attachments/client/attachments-client-types";

export const MAX_ATTACHMENT_SOURCE_BYTES = 8 * 1024 * 1024;
export const MAX_ATTACHMENT_STORED_BYTES = 260 * 1024;
const MAX_ATTACHMENT_EDGE = 1280;
const MIN_ATTACHMENT_QUALITY = 0.38;

const ATTACHMENT_DB_NAME = "taqfeelah_attachment_store";
const ATTACHMENT_STORE_NAME = "images";
const ATTACHMENT_STORAGE_OPTIONS = { scope: "local-attachment-cache" } as const;
const ATTACHMENT_STORE_CONFIG = {
  databaseName: ATTACHMENT_DB_NAME,
  storeName: ATTACHMENT_STORE_NAME,
};

export function approximateDataUrlBytes(value = ""): number {
  return Math.ceil((value.length * 3) / 4);
}

export function makeAttachment(
  id: string,
  prepared: PreparedAttachment | null = null,
): PreparedAttachment | null {
  return prepared ? { ...prepared, id: `attachment-${id}` } : null;
}

export async function prepareAttachment(file: File): Promise<PreparedAttachment> {
  if (!file?.type?.startsWith("image/")) throw new Error("invalid");
  if (file.size > MAX_ATTACHMENT_SOURCE_BYTES) throw new Error("large");
  const sourceUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = reject;
      element.src = sourceUrl;
    });
    let scale = Math.min(1, MAX_ATTACHMENT_EDGE / Math.max(image.naturalWidth, image.naturalHeight));
    let quality = 0.8;
    let dataUrl = "";
    for (let attempt = 0; attempt < 9; attempt += 1) {
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      const context = canvas.getContext("2d", { alpha: false });
      if (!context) throw new Error("invalid");
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      dataUrl = canvas.toDataURL("image/jpeg", quality);
      if (approximateDataUrlBytes(dataUrl) <= MAX_ATTACHMENT_STORED_BYTES) break;
      if (quality > MIN_ATTACHMENT_QUALITY) quality -= 0.1;
      else scale *= 0.82;
    }
    const sizeBytes = approximateDataUrlBytes(dataUrl);
    if (sizeBytes > MAX_ATTACHMENT_STORED_BYTES) throw new Error("large");
    return { kind: "image", name: file.name || "attachment.jpg", mimeType: "image/jpeg", sizeBytes, dataUrl };
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }
}

export async function storeAttachmentPayload(attachment: StoredAttachmentPayload): Promise<void> {
  if (!attachment?.id || !attachment?.dataUrl) return;
  await safePutIndexedDbValue(
    ATTACHMENT_STORE_CONFIG,
    attachment.id,
    attachment.dataUrl,
    ATTACHMENT_STORAGE_OPTIONS,
  );
}

export async function deleteAttachmentPayload(attachmentId: string): Promise<void> {
  if (!attachmentId) return;
  await safeDeleteIndexedDbValue(ATTACHMENT_STORE_CONFIG, attachmentId, ATTACHMENT_STORAGE_OPTIONS);
}

export async function readAttachmentPayload(attachmentId: string): Promise<string | null> {
  if (!attachmentId) return null;
  return safeGetIndexedDbValue<string>(ATTACHMENT_STORE_CONFIG, attachmentId, ATTACHMENT_STORAGE_OPTIONS);
}

export function stripEmbeddedAttachmentImages(entries: OperationalEntry[]): OperationalEntry[] {
  return entries.map((entry) => (
    entry.attachment
      ? { ...entry, attachment: { ...entry.attachment, dataUrl: undefined } }
      : entry
  ));
}
