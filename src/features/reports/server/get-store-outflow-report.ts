import { and, desc, eq, gte, inArray, lte } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/core/db/client";
import { attachments, entries, outflowCategories } from "@/core/db/schema";
import { assertStoreAccess } from "@/core/auth/assert-store-access";
import { type MemberRole } from "@/core/auth/roles";
import { ValidationError } from "@/core/errors/app-error";
import { resolveOutflowCategoryKey } from "@/features/reports/server/outflow-category-key";
import { assertBoundedReportRange } from "@/features/reports/server/report-date-range";
import { mergeEntryScopeWithCloseoutLink } from "@/features/entries/server/closeout-linked-entry-filter";

const inputSchema = z.object({
  organizationId: z.string().uuid(),
  storeId: z.string().uuid(),
  actorUserId: z.string().uuid(),
  actorRole: z.enum(["owner", "manager", "employee"]),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  categoryKey: z.string().trim().max(40).optional(),
  includeTransactions: z.boolean().optional(),
});

const OUTFLOW_TYPES = ["purchases", "expense", "withdrawal"] as const;

export async function getStoreOutflowReport(rawInput: z.infer<typeof inputSchema>) {
  const parsed = inputSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ValidationError("Invalid outflow report input.", parsed.error.flatten());
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
      inArray(entries.type, OUTFLOW_TYPES),
    ),
  );
  const rows = await db
    .select({
      id: entries.id,
      date: entries.date,
      type: entries.type,
      categoryId: entries.categoryId,
      categoryName: outflowCategories.name,
      amountHalalas: entries.amountHalalas,
      attachmentId: attachments.id,
    })
    .from(entries)
    .leftJoin(outflowCategories, eq(outflowCategories.id, entries.categoryId))
    .leftJoin(attachments, eq(attachments.entryId, entries.id))
    .where(entryScope)
    .orderBy(desc(entries.date), desc(entries.createdAt));

  const categoryTotals = new Map<string, number>();
  const transactions: Array<{
    id: string;
    date: string;
    type: string;
    categoryKey: string;
    amountHalalas: number;
    hasAttachment: boolean;
  }> = [];

  rows.forEach((row) => {
    const categoryKey = resolveOutflowCategoryKey({
      type: row.type,
      categoryId: row.categoryId,
      categoryName: row.categoryName,
    });
    if (input.categoryKey && input.categoryKey !== "all" && categoryKey !== input.categoryKey) {
      return;
    }
    categoryTotals.set(categoryKey, (categoryTotals.get(categoryKey) || 0) + row.amountHalalas);
    if (input.includeTransactions) {
      transactions.push({
        id: row.id,
        date: row.date,
        type: row.type,
        categoryKey,
        amountHalalas: row.amountHalalas,
        hasAttachment: Boolean(row.attachmentId),
      });
    }
  });

  const totalOutflowHalalas = [...categoryTotals.values()].reduce((sum, value) => sum + value, 0);
  const transactionCount = rows.filter((row) => {
    const categoryKey = resolveOutflowCategoryKey({
      type: row.type,
      categoryId: row.categoryId,
      categoryName: row.categoryName,
    });
    return !input.categoryKey || input.categoryKey === "all" || categoryKey === input.categoryKey;
  }).length;

  return {
    storeId: input.storeId,
    from: range.from,
    to: range.to,
    categoryKey: input.categoryKey || "all",
    totalOutflow: { amountHalalas: totalOutflowHalalas, currency: "SAR" as const },
    transactionCount,
    categories: [...categoryTotals.entries()]
      .map(([categoryKey, amountHalalas]) => ({ categoryKey, amountHalalas }))
      .sort((a, b) => b.amountHalalas - a.amountHalalas),
    transactions: input.includeTransactions ? transactions : undefined,
  };
}
