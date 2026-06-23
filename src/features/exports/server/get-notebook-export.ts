import { and, desc, eq, gte, inArray, lte, or, sql } from "drizzle-orm";
import { z } from "zod";
import { assertStoreAccess } from "@/core/auth/assert-store-access";
import { type MemberRole } from "@/core/auth/roles";
import { getDb } from "@/core/db/client";
import { attachments, entries, entrySalesChannels } from "@/core/db/schema";
import { ValidationError } from "@/core/errors/app-error";
import { getStorePeriodSummary } from "@/features/reports/server/get-store-period-summary";
import { assertBoundedReportRange } from "@/features/reports/server/report-date-range";

const inputSchema = z.object({
  organizationId: z.string().uuid(),
  storeId: z.string().uuid(),
  actorUserId: z.string().uuid(),
  actorRole: z.enum(["owner", "manager", "employee"]),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  period: z.enum(["day", "month", "year", "custom"]).default("day"),
});

const ALLOWED_TYPES = ["summary", "purchases", "expense", "withdrawal"] as const;
const EXPORT_OPERATIONS_PAGE_SIZE = 500;
const EXPORT_ID_CHUNK_SIZE = 1000;

type ExportOperationRow = {
  id: string;
  date: string;
  type: string;
  amountHalalas: number;
  note: string | null;
  createdAt: Date;
};

function toRiyals(halalas: number): number {
  return Number((halalas / 100).toFixed(2));
}

function cursorBeforeClause(cursor: { date: string; createdAt: Date; id: string }) {
  return or(
    sql`${entries.date} < ${cursor.date}`,
    and(
      eq(entries.date, cursor.date),
      sql`${entries.createdAt} < ${cursor.createdAt}`,
    ),
    and(
      eq(entries.date, cursor.date),
      sql`${entries.createdAt} = ${cursor.createdAt}`,
      sql`${entries.id} < ${cursor.id}`,
    ),
  );
}

function chunkArray<T>(items: T[], chunkSize: number): T[][] {
  if (items.length === 0) return [];
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += chunkSize) {
    chunks.push(items.slice(index, index + chunkSize));
  }
  return chunks;
}

export async function getNotebookExport(rawInput: z.infer<typeof inputSchema>) {
  const parsed = inputSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ValidationError("Invalid notebook export input.", parsed.error.flatten());
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

  const summary = await getStorePeriodSummary({
    organizationId: input.organizationId,
    storeId: input.storeId,
    actorUserId: input.actorUserId,
    actorRole: input.actorRole,
    from: range.from,
    to: range.to,
  });

  const db = getDb();
  const entryRows: ExportOperationRow[] = [];

  let cursor: { date: string; createdAt: Date; id: string } | null = null;
  for (let page = 0; page < 10_000; page += 1) {
    const pageRows: ExportOperationRow[] = await db
      .select({
        id: entries.id,
        date: entries.date,
        type: entries.type,
        amountHalalas: entries.amountHalalas,
        note: entries.note,
        createdAt: entries.createdAt,
      })
      .from(entries)
      .where(
        and(
          eq(entries.organizationId, input.organizationId),
          eq(entries.storeId, input.storeId),
          gte(entries.date, range.from),
          lte(entries.date, range.to),
          eq(entries.status, "active"),
          inArray(entries.type, ALLOWED_TYPES),
          cursor ? cursorBeforeClause(cursor) : undefined,
        ),
      )
      .orderBy(desc(entries.date), desc(entries.createdAt), desc(entries.id))
      .limit(EXPORT_OPERATIONS_PAGE_SIZE);

    if (pageRows.length === 0) break;
    entryRows.push(...pageRows);

    if (pageRows.length < EXPORT_OPERATIONS_PAGE_SIZE) break;

    const lastRow = pageRows[pageRows.length - 1];
    cursor = {
      date: lastRow.date,
      createdAt: lastRow.createdAt,
      id: lastRow.id,
    };
  }

  const entryIds = entryRows.map((row) => row.id);
  const channelRows: Array<{
    entryId: string;
    salesChannelId: string;
    channelNameSnapshot: string;
    amountHalalas: number;
  }> = [];
  if (entryIds.length > 0) {
    const entryIdChunks = chunkArray(entryIds, EXPORT_ID_CHUNK_SIZE);
    for (const entryIdChunk of entryIdChunks) {
      const rows = await db
        .select({
          entryId: entrySalesChannels.entryId,
          salesChannelId: entrySalesChannels.salesChannelId,
          channelNameSnapshot: entrySalesChannels.channelNameSnapshot,
          amountHalalas: entrySalesChannels.amountHalalas,
        })
        .from(entrySalesChannels)
        .where(
          and(
            eq(entrySalesChannels.organizationId, input.organizationId),
            eq(entrySalesChannels.storeId, input.storeId),
            inArray(entrySalesChannels.entryId, entryIdChunk),
          ),
        );
      channelRows.push(...rows);
    }
  }

  const attachmentRows: Array<{ entryId: string }> = [];
  if (entryIds.length > 0) {
    const entryIdChunks = chunkArray(entryIds, EXPORT_ID_CHUNK_SIZE);
    for (const entryIdChunk of entryIdChunks) {
      const rows = await db
        .select({ entryId: attachments.entryId })
        .from(attachments)
        .where(
          and(
            eq(attachments.organizationId, input.organizationId),
            eq(attachments.storeId, input.storeId),
            inArray(attachments.entryId, entryIdChunk),
          ),
        );
      attachmentRows.push(...rows);
    }
  }

  const attachmentEntryIds = new Set(attachmentRows.map((row) => row.entryId));
  const channelTotals = new Map<string, { channelId: string; name: string; amountHalalas: number }>();
  channelRows.forEach((row) => {
    const current = channelTotals.get(row.salesChannelId) || {
      channelId: row.salesChannelId,
      name: row.channelNameSnapshot,
      amountHalalas: 0,
    };
    current.amountHalalas += row.amountHalalas;
    channelTotals.set(row.salesChannelId, current);
  });

  return {
    storeId: input.storeId,
    period: input.period,
    from: range.from,
    to: range.to,
    totals: {
      sales: toRiyals(summary.totalSales.amountHalalas),
      expense: toRiyals(summary.totalOutflow.amountHalalas),
      net: toRiyals(summary.netMovement.amountHalalas),
      ratio: summary.outflowRatio,
      proofs: summary.attachmentCount,
    },
    channels: [...channelTotals.values()].map((row) => ({
      channelId: row.channelId,
      name: row.name,
      amount: toRiyals(row.amountHalalas),
    })),
    operations: entryRows.map((row) => ({
      id: row.id,
      date: row.date,
      type: row.type,
      amount: toRiyals(row.amountHalalas),
      note: row.note || "",
      hasAttachment: attachmentEntryIds.has(row.id),
      createdAt: row.createdAt.toISOString(),
    })),
  };
}
