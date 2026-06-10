import { and, eq, inArray } from "drizzle-orm";
import type { getDb } from "@/core/db/client";
import { attachments } from "@/core/db/schema";
import { resolveInlineAttachmentDataUrl } from "@/features/entries/server/inline-attachment";

type AttachmentDb = ReturnType<typeof getDb>;

export async function loadEntryAttachmentUrlsByEntryId(
  db: AttachmentDb,
  organizationId: string,
  storeId: string,
  entryIds: string[],
): Promise<Map<string, string[]>> {
  const result = new Map<string, string[]>();
  if (!entryIds.length) return result;

  const rows = await db
    .select({
      entryId: attachments.entryId,
      storageKey: attachments.storageKey,
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
    const dataUrl = resolveInlineAttachmentDataUrl(row.storageKey);
    if (!dataUrl) return;
    const current = result.get(row.entryId) || [];
    current.push(dataUrl);
    result.set(row.entryId, current);
  });

  return result;
}
