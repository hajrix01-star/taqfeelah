import { and, eq, sql } from "drizzle-orm";
import { dailyCloseouts } from "@/core/db/schema";
import {
  isOwnerEditCloseoutMode,
  type CloseoutSubmitMode,
} from "@/features/closeouts/closeout-submit-mode";

type SequenceTx = {
  execute?: (query: unknown) => Promise<unknown>;
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
    mode: CloseoutSubmitMode;
  },
): Promise<number> {
  if (isOwnerEditCloseoutMode(input.mode)) {
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

  // Serialize sequence allocation for one store/day inside the surrounding
  // transaction. This prevents concurrent submissions from choosing the same
  // max(sequence) + 1 value. Test doubles may omit execute().
  if (typeof tx.execute === "function") {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${`${input.storeId}:${input.date}`}, 0))`);
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
