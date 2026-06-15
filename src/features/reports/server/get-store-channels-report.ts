import { and, eq, gte, lte, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/core/db/client";
import { entries, entrySalesChannels } from "@/core/db/schema";
import { assertStoreAccess } from "@/core/auth/assert-store-access";
import { type MemberRole } from "@/core/auth/roles";
import { ValidationError } from "@/core/errors/app-error";
import { assertBoundedReportRange } from "@/features/reports/server/report-date-range";
import { mergeEntryScopeWithCloseoutLink } from "@/features/entries/server/closeout-linked-entry-filter";

const inputSchema = z.object({
  organizationId: z.string().uuid(),
  storeId: z.string().uuid(),
  actorUserId: z.string().uuid(),
  actorRole: z.enum(["owner", "manager", "employee"]),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function getStoreChannelsReport(rawInput: z.infer<typeof inputSchema>) {
  const parsed = inputSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ValidationError("Invalid channels report input.", parsed.error.flatten());
  }
  const input = parsed.data;
  const range = assertBoundedReportRange(input.from, input.to);

  await assertStoreAccess({
    organizationId: input.organizationId,
    storeId: input.storeId,
    actorUserId: input.actorUserId,
    actorRole: input.actorRole as MemberRole,
    minimumRole: "employee",
    scope: "read",
  });

  const db = getDb();
  const entryScope = mergeEntryScopeWithCloseoutLink(
    input.organizationId,
    input.storeId,
    and(
      eq(entrySalesChannels.organizationId, input.organizationId),
      eq(entrySalesChannels.storeId, input.storeId),
      gte(entries.date, range.from),
      lte(entries.date, range.to),
      eq(entries.status, "active"),
      eq(entries.type, "summary"),
    ),
  );
  const rows = await db
    .select({
      salesChannelId: entrySalesChannels.salesChannelId,
      channelName: entrySalesChannels.channelNameSnapshot,
      amountHalalas: sql<number>`coalesce(sum(${entrySalesChannels.amountHalalas}), 0)::int`,
    })
    .from(entrySalesChannels)
    .innerJoin(entries, eq(entries.id, entrySalesChannels.entryId))
    .where(entryScope)
    .groupBy(entrySalesChannels.salesChannelId, entrySalesChannels.channelNameSnapshot)
    .orderBy(sql`coalesce(sum(${entrySalesChannels.amountHalalas}), 0) desc`);

  return {
    storeId: input.storeId,
    from: range.from,
    to: range.to,
    channels: rows
      .filter((row) => row.amountHalalas > 0)
      .map((row) => ({
        salesChannelId: row.salesChannelId,
        channelName: row.channelName,
        amount: { amountHalalas: row.amountHalalas, currency: "SAR" as const },
      })),
  };
}
