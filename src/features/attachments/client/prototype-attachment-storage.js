export const MAX_ATTACHMENT_SOURCE_BYTES = 8 * 1024 * 1024;
export const MAX_ATTACHMENT_STORED_BYTES = 260 * 1024;
const MAX_ATTACHMENT_EDGE = 1280;
const MIN_ATTACHMENT_QUALITY = 0.38;

const ATTACHMENT_DB_NAME = "taqfeelah_attachment_store";
const ATTACHMENT_STORE_NAME = "images";

export function approximateDataUrlBytes(value = "") {
  return Math.ceil((value.length * 3) / 4);
}

/**
 * @param {string} id
 * @param {Record<string, unknown> | null | undefined} [prepared]
 */
export function makeAttachment(id, prepared = null) {
  return prepared ? { ...prepared, id: `attachment-${id}` } : null;
}

export async function prepareAttachment(file) {
  if (!file?.type?.startsWith("image/")) throw new Error("invalid");
  if (file.size > MAX_ATTACHMENT_SOURCE_BYTES) throw new Error("large");
  const sourceUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise((resolve, reject) => {
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

function openAttachmentDatabase() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") return reject(new Error("unsupported"));
    const request = indexedDB.open(ATTACHMENT_DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(ATTACHMENT_STORE_NAME)) {
        request.result.createObjectStore(ATTACHMENT_STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function storeAttachmentPayload(attachment) {
  if (!attachment?.id || !attachment?.dataUrl) return;
  const database = await openAttachmentDatabase();
  await new Promise((resolve, reject) => {
    const transaction = database.transaction(ATTACHMENT_STORE_NAME, "readwrite");
    transaction.objectStore(ATTACHMENT_STORE_NAME).put(attachment.dataUrl, attachment.id);
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
  });
  database.close();
}

export async function deleteAttachmentPayload(attachmentId) {
  if (!attachmentId) return;
  const database = await openAttachmentDatabase();
  await new Promise((resolve, reject) => {
    const transaction = database.transaction(ATTACHMENT_STORE_NAME, "readwrite");
    transaction.objectStore(ATTACHMENT_STORE_NAME).delete(attachmentId);
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
  });
  database.close();
}

export async function readAttachmentPayload(attachmentId) {
  if (!attachmentId) return null;
  try {
    const database = await openAttachmentDatabase();
    const result = await new Promise((resolve, reject) => {
      const transaction = database.transaction(ATTACHMENT_STORE_NAME, "readonly");
      const request = transaction.objectStore(ATTACHMENT_STORE_NAME).get(attachmentId);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
    database.close();
    return result;
  } catch {
    return null;
  }
}

export function stripEmbeddedAttachmentImages(entries) {
  return entries.map((entry) => (
    entry.attachment
      ? { ...entry, attachment: { ...entry.attachment, dataUrl: undefined } }
      : entry
  ));
}
