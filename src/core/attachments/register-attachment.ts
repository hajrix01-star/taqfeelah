import { z } from "zod";
import {
  INLINE_ATTACHMENT_MAX_BYTES,
  INLINE_ATTACHMENT_MAX_DATA_URL_LENGTH,
} from "@/core/attachments/inline-attachment-limits";
import { ValidationError } from "@/core/errors/app-error";
import { readAttachmentStorageMode } from "@/core/attachments/attachment-storage-mode";
import {
  isLocalVpsStorageKey,
  registerLocalVpsAttachment,
} from "@/core/attachments/local-vps-attachment-storage";
import { registerInlineAttachment } from "@/features/entries/server/inline-attachment";
import { rejectClientAttachmentStorageKey } from "@/core/attachments/reject-client-attachment-storage-key";

const registerAttachmentSchema = z.object({
  organizationId: z.string().uuid(),
  storeId: z.string().uuid(),
  kind: z.literal("image").default("image"),
  name: z.string().trim().min(1).max(220).optional(),
  mimeType: z.string().trim().min(1).max(120).default("image/jpeg"),
  sizeBytes: z.number().int().positive().max(INLINE_ATTACHMENT_MAX_BYTES),
  dataUrl: z.string().trim().min(32).max(INLINE_ATTACHMENT_MAX_DATA_URL_LENGTH).optional(),
  storageKey: z.string().trim().min(8).max(512).optional(),
}).refine((value) => Boolean(value.dataUrl || value.storageKey), {
  message: "Attachment requires dataUrl or storageKey.",
});

export type RegisterAttachmentInput = z.infer<typeof registerAttachmentSchema>;

export type RegisteredAttachment = {
  kind: "image";
  name: string;
  mimeType: string;
  sizeBytes: number;
  storageKey: string;
  checksum?: string;
};

export async function registerAttachment(rawInput: RegisterAttachmentInput): Promise<RegisteredAttachment> {
  const parsed = registerAttachmentSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ValidationError("Invalid attachment input.", parsed.error.flatten());
  }

  const input = parsed.data;
  rejectClientAttachmentStorageKey(input.storageKey);

  if (!input.dataUrl) {
    throw new ValidationError("Attachment requires dataUrl or storageKey.");
  }

  const mode = readAttachmentStorageMode();
  if (mode === "local") {
    return registerLocalVpsAttachment({
      organizationId: input.organizationId,
      storeId: input.storeId,
      name: input.name,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
      dataUrl: input.dataUrl,
    });
  }

  return registerInlineAttachment({
    kind: input.kind,
    name: input.name,
    mimeType: input.mimeType,
    sizeBytes: input.sizeBytes,
    dataUrl: input.dataUrl,
  });
}

export function isManagedAttachmentStorageKey(storageKey: string | null | undefined): boolean {
  if (!storageKey) return false;
  return storageKey.startsWith("inline:v1:")
    || isLocalVpsStorageKey(storageKey)
    || storageKey.startsWith("data:");
}
