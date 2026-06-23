import { and, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/core/db/client";
import { entries } from "@/core/db/schema";
import { assertStoreAccess } from "@/core/auth/assert-store-access";
import { type MemberRole } from "@/core/auth/roles";
import { ValidationError } from "@/core/errors/app-error";
import { formatOutflowRatio } from "@/core/money/halalas";
import { queryAttachmentStatsForStoreScope } from "@/features/reports/server/attachment-stats-query";
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

const ALLOWED_TYPES = ["summary", "purchases", "expense", "withdrawal"] as const;

export async function getStorePeriodSummary(rawInput: z.infer<typeof inputSchema>) {
  const parsed = inputSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ValidationError("Invalid period summary input.", parsed.error.flatten());
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
      eq(entries.organizationId, input.organizationId),
      eq(entries.storeId, input.storeId),
      gte(entries.date, range.from),
      lte(entries.date, range.to),
      eq(entries.status, "active"),
      inArray(entries.type, ALLOWED_TYPES),
    ),
  );

  const [totals] = await db
    .select({
      totalSalesHalalas:
        sql<number>`coalesce(sum(case when ${entries.type} = 'summary' then ${entries.amountHalalas} else 0 end), 0)::int`,
      totalOutflowHalalas:
        sql<number>`coalesce(sum(case when ${entries.type} in ('purchases', 'expense', 'withdrawal') then ${entries.amountHalalas} else 0 end), 0)::int`,
    })
    .from(entries)
    .where(entryScope);

  const totalSalesHalalas = totals?.totalSalesHalalas ?? 0;
  const totalOutflowHalalas = totals?.totalOutflowHalalas ?? 0;
  const netMovementHalalas = totalSalesHalalas - totalOutflowHalalas;
  const { ratio: outflowRatio, status: outflowRatioStatus } = formatOutflowRatio(
    totalSalesHalalas,
    totalOutflowHalalas,
  );

  const attachmentStats = await queryAttachmentStatsForStoreScope(
    db,
    input.organizationId,
    input.storeId,
    entryScope,
  );

  return {
    storeId: input.storeId,
    from: range.from,
    to: range.to,
    totalSales: { amountHalalas: totalSalesHalalas, currency: "SAR" as const },
    totalOutflow: { amountHalalas: totalOutflowHalalas, currency: "SAR" as const },
    netMovement: { amountHalalas: netMovementHalalas, currency: "SAR" as const },
    outflowRatio,
    outflowRatioStatus,
    attachmentCount: attachmentStats.attachmentCount,
  };
}
