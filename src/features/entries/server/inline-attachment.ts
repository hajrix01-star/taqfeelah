import { createHash } from "node:crypto";
import { z } from "zod";
import { ValidationError } from "@/core/errors/app-error";

const inlineAttachmentSchema = z.object({
  kind: z.literal("image").default("image"),
  name: z.string().trim().min(1).max(220).optional(),
  mimeType: z.string().trim().min(1).max(120).default("image/jpeg"),
  sizeBytes: z.number().int().positive().max(350 * 1024),
  dataUrl: z.string().trim().min(32).max(500_000),
});

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);
const INLINE_STORAGE_PREFIX = "inline:v1:";

export function registerInlineAttachment(rawInput: unknown) {
  const parsed = inlineAttachmentSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ValidationError("Invalid inline attachment input.", parsed.error.flatten());
  }
  const input = parsed.data;
  const mimeType = input.mimeType.toLowerCase();
  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
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
