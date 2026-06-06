import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { auditEvents } from "@/core/db/schema";
import { parseCloseoutDaySequence } from "@/features/closeouts/server/parse-closeout-day-sequence";

type SequenceTx = {
  select: (fields: unknown) => {
    from: (table: unknown) => {
      where: (condition: unknown) => unknown;
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
    const previousQuery = tx
      .select({ metadata: auditEvents.metadata })
      .from(auditEvents)
      .where(
        and(
          eq(auditEvents.organizationId, input.organizationId),
          eq(auditEvents.storeId, input.storeId),
          inArray(auditEvents.action, ["closeout_submitted", "closeout_resubmitted"]),
          sql`${auditEvents.metadata} ->> 'closeoutId' = ${input.closeoutId}`,
        ),
      ) as {
      orderBy: (...args: unknown[]) => {
        limit: (count: number) => Promise<Array<{ metadata?: unknown }>>;
      };
    };
    const previousRows = await previousQuery.orderBy(desc(auditEvents.createdAt)).limit(1);

    const previousSequence = parseCloseoutDaySequence(previousRows[0]?.metadata);
    if (previousSequence) return previousSequence;
  }

  const maxRows = await (tx
    .select({
      maxSequence: sql<number>`coalesce(max((${auditEvents.metadata} ->> 'daySequence')::int), 0)`,
    })
    .from(auditEvents)
    .where(
      and(
        eq(auditEvents.organizationId, input.organizationId),
        eq(auditEvents.storeId, input.storeId),
        inArray(auditEvents.action, ["closeout_submitted", "closeout_resubmitted"]),
        sql`${auditEvents.metadata} ->> 'date' = ${input.date}`,
      ),
    ) as Promise<Array<{ maxSequence?: number }>>);

  const maxSequence = Number(maxRows[0]?.maxSequence || 0);
  return maxSequence + 1;
}
