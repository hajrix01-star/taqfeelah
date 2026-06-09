import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/core/db/client";
import { entries, stores } from "@/core/db/schema";
import { ForbiddenError, ValidationError } from "@/core/errors/app-error";
import { assertStoreAccess } from "@/core/auth/assert-store-access";
import { calculateDaySummary } from "@/domain/cash-movement/calculations";
import { queryAttachmentStatsForStoreScope } from "@/features/reports/server/attachment-stats-query";
import { type MemberRole } from "@/core/auth/roles";
import { mergeEntryScopeWithCloseoutLink } from "@/features/entries/server/closeout-linked-entry-filter";

const summaryInputSchema = z.object({
  storeId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD"),
  organizationId: z.string().uuid(),
  actorUserId: z.string().uuid().optional(),
  actorRole: z.string().optional(),
});

type SummaryInput = z.infer<typeof summaryInputSchema>;

const ALLOWED_TYPES = ["summary", "purchases", "expense", "withdrawal"] as const;

export async function getStoreDaySummary(rawInput: SummaryInput) {
  const parsed = summaryInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ValidationError("Invalid summary request input.", parsed.error.flatten());
  }

  const input = parsed.data;

  if (input.actorUserId && input.actorRole) {
    await assertStoreAccess({
      organizationId: input.organizationId,
      storeId: input.storeId,
      actorUserId: input.actorUserId,
      actorRole: input.actorRole as MemberRole,
      minimumRole: "employee",
    });
  } else {
    const db = getDb();
    const [storeRow] = await db
      .select({ id: stores.id })
      .from(stores)
      .where(
        and(
          eq(stores.id, input.storeId),
          eq(stores.organizationId, input.organizationId),
          eq(stores.status, "active"),
        ),
      )
      .limit(1);
    if (!storeRow) {
      throw new ForbiddenError("Store is not accessible for this organization.");
    }
  }

  const db = getDb();
  const entryScope = mergeEntryScopeWithCloseoutLink(
    input.organizationId,
    input.storeId,
    and(
      eq(entries.organizationId, input.organizationId),
      eq(entries.storeId, input.storeId),
      eq(entries.date, input.date),
      eq(entries.status, "active"),
      inArray(entries.type, ALLOWED_TYPES),
    ),
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
    date: input.date,
    totalSales: { amountHalalas: result.totalSalesHalalas, currency: "SAR" as const },
    totalOutflow: { amountHalalas: result.totalOutflowHalalas, currency: "SAR" as const },
    netMovement: { amountHalalas: result.netMovementHalalas, currency: "SAR" as const },
    outflowRatio: result.outflowRatio,
    outflowRatioStatus: result.outflowRatioStatus,
    attachmentCount: attachmentStats.attachmentCount,
    pendingReviewCount: attachmentStats.pendingReviewCount,
  };
}
