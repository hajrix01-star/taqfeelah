import { attachments } from "@/core/db/schema";
import {
  normalizeCloseoutAttachmentList,
  toPersistableCloseoutAttachment,
  type CloseoutAttachmentInput,
} from "@/features/closeouts/server/closeout-attachment-input";

type PersistCloseoutEntryAttachmentsInput = {
  organizationId: string;
  storeId: string;
  entryId: string;
  attachments: CloseoutAttachmentInput[];
};

type AttachmentInsertClient = {
  insert: (table: typeof attachments) => {
    values: (values: Record<string, unknown>[]) => Promise<unknown>;
  };
};

export async function persistCloseoutEntryAttachments(
  tx: AttachmentInsertClient,
  input: PersistCloseoutEntryAttachmentsInput,
) {
  if (!input.attachments.length) return;

  const rows = await Promise.all(input.attachments.map(async (attachment) => {
    const persistable = await toPersistableCloseoutAttachment(attachment, {
      organizationId: input.organizationId,
      storeId: input.storeId,
    });
    return {
      organizationId: input.organizationId,
      storeId: input.storeId,
      entryId: input.entryId,
      storageKey: persistable.storageKey,
      originalFileName: persistable.originalFileName,
      mimeType: persistable.mimeType,
      sizeBytes: persistable.sizeBytes,
    };
  }));

  await tx.insert(attachments).values(rows);
}

export function normalizeCloseoutLevelAttachments(raw: unknown): CloseoutAttachmentInput[] {
  return normalizeCloseoutAttachmentList(raw);
}

export function normalizeOutflowAttachments(raw: unknown): CloseoutAttachmentInput[] {
  return normalizeCloseoutAttachmentList(raw);
}
