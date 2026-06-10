import { eq, sql, type SQL } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { attachments, entries } from "@/core/db/schema";
import { normalizeAttachmentStats } from "@/domain/attachment-stats/stats";

type DbClient = Pick<NodePgDatabase<Record<string, never>>, "select">;

export const entriesWithAttachmentsCountSql = sql<number>`count(distinct case when ${attachments.id} is not null then ${entries.id} end)::int`;

export async function queryAttachmentStatsForScope(
  db: DbClient,
  entryScope: SQL | undefined,
) {
  const [stats] = await db
    .select({
      attachmentCount: entriesWithAttachmentsCountSql,
    })
    .from(entries)
    .leftJoin(attachments, eq(attachments.entryId, entries.id))
    .where(entryScope);

  return normalizeAttachmentStats({
    attachmentCount: stats?.attachmentCount ?? 0,
  });
}

export async function queryAttachmentStatsForStoreScope(
  db: DbClient,
  organizationId: string,
  storeId: string,
  entryScope: SQL | undefined,
) {
  void organizationId;
  void storeId;
  return queryAttachmentStatsForScope(db, entryScope);
}
