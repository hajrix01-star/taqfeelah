import { createHash } from "node:crypto";
import { z } from "zod";
import {
  assertAllowedAttachmentMimeType,
  normalizeAttachmentMimeType,
} from "@/core/attachments/attachment-mime";
import {
  INLINE_ATTACHMENT_MAX_BYTES,
  INLINE_ATTACHMENT_MAX_DATA_URL_LENGTH,
} from "@/core/attachments/inline-attachment-limits";
import { ValidationError } from "@/core/errors/app-error";

const inlineAttachmentSchema = z.object({
  kind: z.literal("image").default("image"),
  name: z.string().trim().min(1).max(220).optional(),
  mimeType: z.string().trim().min(1).max(120).default("image/jpeg"),
  sizeBytes: z.number().int().positive().max(INLINE_ATTACHMENT_MAX_BYTES),
  dataUrl: z.string().trim().min(32).max(INLINE_ATTACHMENT_MAX_DATA_URL_LENGTH),
});

export const INLINE_STORAGE_PREFIX = "inline:v1:";

export function registerInlineAttachment(rawInput: unknown) {
  const parsed = inlineAttachmentSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ValidationError("Invalid inline attachment input.", parsed.error.flatten());
  }
  const input = parsed.data;
  const mimeType = normalizeAttachmentMimeType(input.mimeType);
  try {
    assertAllowedAttachmentMimeType(mimeType);
  } catch {
    throw new ValidationError("Unsupported attachment mime type.");
  }
  if (!input.dataUrl.startsWith("data:")) {
    throw new ValidationError("Inline attachment must use a data URL.");
  }
  const prefix = `data:${mimeType};base64,`;
  if (!input.dataUrl.startsWith(prefix) && !input.dataUrl.startsWith(`data:${mimeType};base64,`)) {
    throw new ValidationError("Attachment data URL does not match mime type.");
  }

  const digest = createHash("sha256").update(input.dataUrl).digest("hex").slice(0, 24);
  return {
    kind: "image" as const,
    name: input.name || "attachment.jpg",
    mimeType,
    sizeBytes: input.sizeBytes,
    storageKey: `${INLINE_STORAGE_PREFIX}${digest}:${input.dataUrl}`,
    checksum: digest,
  };
}

export function resolveInlineAttachmentDataUrl(storageKey: string | null | undefined): string {
  if (!storageKey) return "";
  if (storageKey.startsWith("data:")) return storageKey;
  if (!storageKey.startsWith(INLINE_STORAGE_PREFIX)) return "";
  const payloadStart = storageKey.indexOf(":data:");
  if (payloadStart === -1) return "";
  return storageKey.slice(payloadStart + 1);
}
