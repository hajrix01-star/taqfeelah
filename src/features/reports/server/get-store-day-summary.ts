import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/core/db/client";
import { entries } from "@/core/db/schema";
import { ValidationError } from "@/core/errors/app-error";
import { calculateDaySummary } from "@/domain/cash-movement/calculations";

const summaryInputSchema = z.object({
  storeId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD"),
  organizationId: z.string().uuid(),
});

type SummaryInput = z.infer<typeof summaryInputSchema>;

const ALLOWED_TYPES = ["summary", "purchases", "expense", "withdrawal"] as const;

export async function getStoreDaySummary(rawInput: SummaryInput) {
  const parsed = summaryInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ValidationError("Invalid summary request input.", parsed.error.flatten());
  }

  const input = parsed.data;
  const db = getDb();

  const rows = await db
    .select({
      type: entries.type,
      amountHalalas: entries.amountHalalas,
    })
    .from(entries)
    .where(
      and(
        eq(entries.organizationId, input.organizationId),
        eq(entries.storeId, input.storeId),
        eq(entries.date, input.date),
        eq(entries.status, "active"),
        inArray(entries.type, ALLOWED_TYPES),
      ),
    );

  const result = calculateDaySummary(
    rows.map((row) => ({
      type: row.type as (typeof ALLOWED_TYPES)[number],
      amountHalalas: row.amountHalalas,
    })),
  );

  return {
    storeId: input.storeId,
    date: input.date,
    totalSales: { amountHalalas: result.totalSalesHalalas, currency: "SAR" as const },
    totalOutflow: { amountHalalas: result.totalOutflowHalalas, currency: "SAR" as const },
    netMovement: { amountHalalas: result.netMovementHalalas, currency: "SAR" as const },
    outflowRatio: result.outflowRatio,
    outflowRatioStatus: result.outflowRatioStatus,
  };
}
