"use client";

import { useEffect, useState } from "react";
import { text } from "@/i18n/text";

// ─── Constants ────────────────────────────────────────────────────
const MAX_ATTACHMENT_SOURCE_BYTES = 8 * 1024 * 1024;
const MAX_ATTACHMENT_STORED_BYTES = 260 * 1024;
const MAX_ATTACHMENT_EDGE = 1280;
const MIN_ATTACHMENT_QUALITY = 0.38;
const ATTACHMENT_DB_NAME = "taqfeelah_attachment_store";
const ATTACHMENT_STORE_NAME = "images";

export const makeAttachment = (id, prepared = null) =>
  prepared ? { ...prepared, id: `attachment-${id}` } : null;

const approximateDataUrlBytes = (value = "") => Math.ceil((value.length * 3) / 4);

// ─── IndexedDB ────────────────────────────────────────────────────
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
  const db = await openAttachmentDatabase();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(ATTACHMENT_STORE_NAME, "readwrite");
    tx.objectStore(ATTACHMENT_STORE_NAME).put(attachment.dataUrl, attachment.id);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function readAttachmentPayload(attachmentId) {
  if (!attachmentId) return null;
  try {
    const db = await openAttachmentDatabase();
    const result = await new Promise((resolve, reject) => {
      const tx = db.transaction(ATTACHMENT_STORE_NAME, "readonly");
      const req = tx.objectStore(ATTACHMENT_STORE_NAME).get(attachmentId);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
    db.close();
    return result;
  } catch { return null; }
}

export async function deleteAttachmentPayload(attachmentId) {
  if (!attachmentId) return;
  const db = await openAttachmentDatabase();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(ATTACHMENT_STORE_NAME, "readwrite");
    tx.objectStore(ATTACHMENT_STORE_NAME).delete(attachmentId);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export function stripEmbeddedAttachmentImages(entries) {
  return entries.map((entry) =>
    entry.attachment ? { ...entry, attachment: { ...entry.attachment, dataUrl: undefined } } : entry,
  );
}

// ─── Image preparation ────────────────────────────────────────────
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

// ─── React hooks ─────────────────────────────────────────────────
export function useAttachmentSource(attachment) {
  const [source, setSource] = useState(attachment?.dataUrl || null);
  useEffect(() => {
    let mounted = true;
    setSource(attachment?.dataUrl || null);
    if (!attachment?.dataUrl && attachment?.id) {
      readAttachmentPayload(attachment.id).then((saved) => { if (mounted) setSource(saved); });
    }
    return () => { mounted = false; };
  }, [attachment?.id, attachment?.dataUrl]);
  return source;
}

export function useAttachmentCapture(lang) {
  const [attachment, setAttachment] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const selectAttachment = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setProcessing(true);
    setError("");
    try {
      setAttachment(await prepareAttachment(file));
    } catch (failure) {
      setError(text(lang, failure?.message === "invalid" ? "invalidAttachment" : "attachmentTooLarge"));
    } finally {
      setProcessing(false);
    }
  };
  const clearAttachment = () => { setAttachment(null); setError(""); };
  return { attachment, processing, error, selectAttachment, clearAttachment };
}
