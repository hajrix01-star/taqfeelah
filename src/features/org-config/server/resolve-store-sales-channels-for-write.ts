import { and, eq } from "drizzle-orm";
import type { getDb } from "@/core/db/client";
import { salesChannels } from "@/core/db/schema";
import { ValidationError } from "@/core/errors/app-error";

type SalesChannelWriteRow = {
  salesChannelId: string;
  channelName: string;
  amountHalalas: number;
};

function normalizeChannelName(value: string): string {
  return value.trim().toLowerCase();
}

/**
 * Map client channel ids to store-scoped sales_channels rows.
 * Accepts canonical ids when present; otherwise resolves by channel name snapshot.
 */
export async function resolveStoreSalesChannelsForWrite(
  db: ReturnType<typeof getDb>,
  organizationId: string,
  storeId: string,
  channels: SalesChannelWriteRow[],
): Promise<SalesChannelWriteRow[]> {
  const positive = channels.filter((row) => row.amountHalalas > 0);
  if (!positive.length) return positive;

  const storeRows = await db
    .select({ id: salesChannels.id, name: salesChannels.name })
    .from(salesChannels)
    .where(
      and(
        eq(salesChannels.organizationId, organizationId),
        eq(salesChannels.storeId, storeId),
        eq(salesChannels.status, "active"),
      ),
    );

  const byId = new Map(storeRows.map((row) => [row.id, row]));
  const byName = new Map(storeRows.map((row) => [normalizeChannelName(row.name), row]));

  return positive.map((row) => {
    if (byId.has(row.salesChannelId)) return row;
    const matched = byName.get(normalizeChannelName(row.channelName));
    if (matched) {
      return { ...row, salesChannelId: matched.id };
    }
    throw new ValidationError(
      `Sales channel is not configured for this store: ${row.channelName || row.salesChannelId}.`,
    );
  });
}
