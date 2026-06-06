import { and, eq, gte, inArray, lte } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/core/db/client";
import { entries } from "@/core/db/schema";
import { assertStoreAccess } from "@/core/auth/assert-store-access";
import { type MemberRole } from "@/core/auth/roles";
import { ValidationError } from "@/core/errors/app-error";
import { calculateDaySummary } from "@/domain/cash-movement/calculations";
import { queryAttachmentStatsForStoreScope } from "@/features/reports/server/attachment-stats-query";
import { assertBoundedReportRange } from "@/features/reports/server/report-date-range";

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
  });

  const db = getDb();
  const entryScope = and(
    eq(entries.organizationId, input.organizationId),
    eq(entries.storeId, input.storeId),
    gte(entries.date, range.from),
    lte(entries.date, range.to),
    eq(entries.status, "active"),
    inArray(entries.type, ALLOWED_TYPES),
  );

  const rows = await db
    .select({
      type: entries.type,
      amountHalalas: entries.amountHalalas,
    })
    .from(entries)
    .where(entryScope);

  const result = calculateDaySummary(
    rows.map((row) => ({
      type: row.type as (typeof ALLOWED_TYPES)[number],
      amountHalalas: row.amountHalalas,
    })),
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
    totalSales: { amountHalalas: result.totalSalesHalalas, currency: "SAR" as const },
    totalOutflow: { amountHalalas: result.totalOutflowHalalas, currency: "SAR" as const },
    netMovement: { amountHalalas: result.netMovementHalalas, currency: "SAR" as const },
    outflowRatio: result.outflowRatio,
    outflowRatioStatus: result.outflowRatioStatus,
    attachmentCount: attachmentStats.attachmentCount,
    pendingReviewCount: attachmentStats.pendingReviewCount,
  };
}
