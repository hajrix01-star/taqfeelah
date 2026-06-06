import { and, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/core/db/client";
import { entries } from "@/core/db/schema";
import { assertStoreAccess } from "@/core/auth/assert-store-access";
import { type MemberRole } from "@/core/auth/roles";
import { ValidationError } from "@/core/errors/app-error";
import { formatOutflowRatio } from "@/core/money/halalas";
import { assertBoundedReportRange } from "@/features/reports/server/report-date-range";

const inputSchema = z.object({
  organizationId: z.string().uuid(),
  storeId: z.string().uuid(),
  actorUserId: z.string().uuid(),
  actorRole: z.enum(["owner", "manager", "employee"]),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function getStoreDaysReport(rawInput: z.infer<typeof inputSchema>) {
  const parsed = inputSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ValidationError("Invalid days report input.", parsed.error.flatten());
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
  const rows = await db
    .select({
      date: entries.date,
      salesHalalas: sql<number>`coalesce(sum(case when ${entries.type} = 'summary' then ${entries.amountHalalas} else 0 end), 0)::int`,
      outflowHalalas: sql<number>`coalesce(sum(case when ${entries.type} in ('purchases', 'expense', 'withdrawal') then ${entries.amountHalalas} else 0 end), 0)::int`,
    })
    .from(entries)
    .where(
      and(
        eq(entries.organizationId, input.organizationId),
        eq(entries.storeId, input.storeId),
        gte(entries.date, range.from),
        lte(entries.date, range.to),
        eq(entries.status, "active"),
        inArray(entries.type, ["summary", "purchases", "expense", "withdrawal"]),
      ),
    )
    .groupBy(entries.date)
    .orderBy(sql`${entries.date} desc`);

  return {
    storeId: input.storeId,
    from: range.from,
    to: range.to,
    days: rows
      .filter((row) => row.salesHalalas > 0 || row.outflowHalalas > 0)
      .map((row) => {
        const { ratio, status } = formatOutflowRatio(row.salesHalalas, row.outflowHalalas);
        return {
          date: row.date,
          totalSales: { amountHalalas: row.salesHalalas, currency: "SAR" as const },
          totalOutflow: { amountHalalas: row.outflowHalalas, currency: "SAR" as const },
          netMovement: {
            amountHalalas: row.salesHalalas - row.outflowHalalas,
            currency: "SAR" as const,
          },
          outflowRatio: ratio,
          outflowRatioStatus: status,
        };
      }),
  };
}
