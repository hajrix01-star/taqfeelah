import { eq, sql, type SQL } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { attachments, entries } from "@/core/db/schema";
import { applyReviewEnabledToAttachmentStats } from "@/domain/attachment-review/stats";
import { readStoreOperationalSettingsRecord } from "@/features/org-config/server/read-store-operational-settings";

type DbClient = Pick<NodePgDatabase<Record<string, never>>, "select">;

export const entriesWithAttachmentsCountSql = sql<number>`count(distinct case when ${attachments.id} is not null then ${entries.id} end)::int`;
export const pendingAttachmentReviewsCountSql = sql<number>`count(distinct case when ${attachments.id} is not null and ${entries.reviewedAt} is null then ${entries.id} end)::int`;

export async function queryAttachmentStatsForScope(
  db: DbClient,
  entryScope: SQL | undefined,
) {
  const [stats] = await db
    .select({
      attachmentCount: entriesWithAttachmentsCountSql,
      pendingReviewCount: pendingAttachmentReviewsCountSql,
    })
    .from(entries)
    .leftJoin(attachments, eq(attachments.entryId, entries.id))
    .where(entryScope);

  return {
    attachmentCount: stats?.attachmentCount ?? 0,
    pendingReviewCount: stats?.pendingReviewCount ?? 0,
  };
}

export async function queryAttachmentStatsForStoreScope(
  db: DbClient,
  organizationId: string,
  storeId: string,
  entryScope: SQL | undefined,
) {
  const rawStats = await queryAttachmentStatsForScope(db, entryScope);
  const operationalSettings = await readStoreOperationalSettingsRecord(db, organizationId, storeId);
  return applyReviewEnabledToAttachmentStats(rawStats, operationalSettings.reviewEnabled);
}
