import { and, eq, sql } from "drizzle-orm";
import { dailyCloseouts } from "@/core/db/schema";

type SequenceTx = {
  select: (fields: unknown) => {
    from: (table: unknown) => {
      where: (condition: unknown) => {
        limit?: (count: number) => Promise<Array<{ daySequence?: number; maxSequence?: number }>>;
      } | Promise<Array<{ maxSequence?: number }>>;
    };
  };
};

export async function resolveCloseoutDaySequence(
  tx: SequenceTx,
  input: {
    organizationId: string;
    storeId: string;
    date: string;
    closeoutId: string;
    mode: "submit" | "resubmit";
  },
): Promise<number> {
  if (input.mode === "resubmit") {
    const existingQuery = tx
      .select({ daySequence: dailyCloseouts.daySequence })
      .from(dailyCloseouts)
      .where(
        and(
          eq(dailyCloseouts.organizationId, input.organizationId),
          eq(dailyCloseouts.storeId, input.storeId),
          eq(dailyCloseouts.clientCloseoutId, input.closeoutId),
        ),
      ) as {
      limit: (count: number) => Promise<Array<{ daySequence?: number }>>;
    };
    const existingRows = await existingQuery.limit(1);
    if (existingRows[0]?.daySequence) return existingRows[0].daySequence;
  }

  const maxRows = await (tx
    .select({
      maxSequence: sql<number>`coalesce(max(${dailyCloseouts.daySequence}), 0)`,
    })
    .from(dailyCloseouts)
    .where(
      and(
        eq(dailyCloseouts.organizationId, input.organizationId),
        eq(dailyCloseouts.storeId, input.storeId),
        eq(dailyCloseouts.date, input.date),
      ),
    ) as Promise<Array<{ maxSequence?: number }>>);

  return Number(maxRows[0]?.maxSequence || 0) + 1;
}
