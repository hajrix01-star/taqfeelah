import { and, eq, inArray } from "drizzle-orm";
import type { getDb } from "@/core/db/client";
import { attachments } from "@/core/db/schema";
import { resolveAttachmentDataUrl } from "@/core/attachments/resolve-attachment-data-url";

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

  for (const row of rows) {
    const dataUrl = await resolveAttachmentDataUrl(row.storageKey);
    if (!dataUrl) continue;
    const current = result.get(row.entryId) || [];
    current.push(dataUrl);
    result.set(row.entryId, current);
  }

  return result;
}
