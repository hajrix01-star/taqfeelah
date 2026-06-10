import { and, eq, inArray } from "drizzle-orm";
import type { getDb } from "@/core/db/client";
import { attachments } from "@/core/db/schema";
import type { CloseoutAttachmentRef } from "@/features/closeouts/server/closeout-attachment-ref";

type AttachmentDb = ReturnType<typeof getDb>;

export async function loadEntryAttachmentMetadataByEntryId(
  db: AttachmentDb,
  organizationId: string,
  storeId: string,
  entryIds: string[],
): Promise<Map<string, CloseoutAttachmentRef[]>> {
  const result = new Map<string, CloseoutAttachmentRef[]>();
  if (!entryIds.length) return result;

  const rows = await db
    .select({
      id: attachments.id,
      entryId: attachments.entryId,
      originalFileName: attachments.originalFileName,
      mimeType: attachments.mimeType,
      sizeBytes: attachments.sizeBytes,
      createdAt: attachments.createdAt,
    })
    .from(attachments)
    .where(
      and(
        eq(attachments.organizationId, organizationId),
        eq(attachments.storeId, storeId),
        inArray(attachments.entryId, entryIds),
      ),
    )
    .orderBy(attachments.createdAt);

  rows.forEach((row) => {
    const current = result.get(row.entryId) || [];
    current.push({
      id: row.id,
      mimeType: row.mimeType,
      sizeBytes: row.sizeBytes,
      name: row.originalFileName || "attachment.jpg",
    });
    result.set(row.entryId, current);
  });

  return result;
}
