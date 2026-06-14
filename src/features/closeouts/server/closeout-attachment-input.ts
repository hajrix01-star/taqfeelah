import { z } from "zod";
import {
  INLINE_ATTACHMENT_MAX_BYTES,
  INLINE_ATTACHMENT_MAX_DATA_URL_LENGTH,
} from "@/core/attachments/inline-attachment-limits";
import { ValidationError } from "@/core/errors/app-error";
import { registerAttachment } from "@/core/attachments/register-attachment";

export const closeoutAttachmentSchema = z.object({
  kind: z.literal("image").default("image"),
  name: z.string().trim().min(1).max(220).optional(),
  mimeType: z.string().trim().min(1).max(120).default("image/jpeg"),
  sizeBytes: z.number().int().positive().max(INLINE_ATTACHMENT_MAX_BYTES),
  dataUrl: z.string().trim().min(32).max(INLINE_ATTACHMENT_MAX_DATA_URL_LENGTH).optional(),
  storageKey: z.string().trim().min(8).max(512).optional(),
}).refine((value) => Boolean(value.dataUrl || value.storageKey), {
  message: "Attachment requires dataUrl or storageKey.",
});

export type CloseoutAttachmentInput = z.infer<typeof closeoutAttachmentSchema>;

const DATA_URL_PATTERN = /^data:([^;]+);base64,(.+)$/;

export function parseCloseoutAttachmentDataUrl(
  raw: string,
  index: number,
): CloseoutAttachmentInput | null {
  if (typeof raw !== "string" || !raw.startsWith("data:")) return null;
  const match = raw.match(DATA_URL_PATTERN);
  if (!match) return null;
  const mimeType = match[1].toLowerCase();
  const base64Payload = match[2];
  const sizeBytes = Math.min(
    Math.ceil((base64Payload.length * 3) / 4),
    INLINE_ATTACHMENT_MAX_BYTES,
  );
  const extension = mimeType.includes("png") ? "png" : mimeType.includes("webp") ? "webp" : "jpg";
  return {
    kind: "image",
    name: `closeout-proof-${index + 1}.${extension}`,
    mimeType,
    sizeBytes: Math.max(sizeBytes, 1),
    dataUrl: raw,
  };
}

export function normalizeCloseoutAttachmentInput(
  raw: unknown,
  index: number,
): CloseoutAttachmentInput | null {
  if (typeof raw === "string") {
    return parseCloseoutAttachmentDataUrl(raw, index);
  }
  if (!raw || typeof raw !== "object") return null;
  const parsed = closeoutAttachmentSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

export function normalizeCloseoutAttachmentList(rawList: unknown): CloseoutAttachmentInput[] {
  if (!Array.isArray(rawList)) return [];
  return rawList
    .map((item, index) => normalizeCloseoutAttachmentInput(item, index))
    .filter((item): item is CloseoutAttachmentInput => Boolean(item));
}

export type PersistableCloseoutAttachment = {
  storageKey: string;
  originalFileName: string;
  mimeType: string;
  sizeBytes: number;
};

export async function toPersistableCloseoutAttachment(
  input: CloseoutAttachmentInput,
  scope: { organizationId: string; storeId: string },
): Promise<PersistableCloseoutAttachment> {
  const normalized = input.storageKey
    ? input
    : await registerAttachment({
      organizationId: scope.organizationId,
      storeId: scope.storeId,
      kind: input.kind,
      name: input.name,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
      dataUrl: input.dataUrl!,
    });
  const storageKey = normalized.storageKey;
  if (!storageKey) {
    throw new ValidationError("Attachment requires dataUrl or storageKey.");
  }
  return {
    storageKey,
    originalFileName: normalized.name || input.name || "attachment.jpg",
    mimeType: normalized.mimeType || input.mimeType || "image/jpeg",
    sizeBytes: normalized.sizeBytes || input.sizeBytes,
  };
}
