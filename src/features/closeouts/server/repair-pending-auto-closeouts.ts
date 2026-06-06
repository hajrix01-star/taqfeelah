import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { getDb } from "@/core/db/client";
import { auditEvents, entries } from "@/core/db/schema";

type SubmitMetadata = {
  closeoutId?: string;
  date?: string;
  summaryEntryId?: string;
  outflowEntryIds?: string[];
};

/**
 * Repairs employee closeouts stuck as submitted (voided entries, no approval audit).
 * Safe to run repeatedly — skips closeouts already approved after the latest submit.
 */
export async function repairPendingAutoCloseouts(organizationId: string) {
  const db = getDb();

  const submitRows = await db
    .select({
      id: auditEvents.id,
      storeId: auditEvents.storeId,
      actorUserId: auditEvents.actorUserId,
      createdAt: auditEvents.createdAt,
      metadata: auditEvents.metadata,
    })
    .from(auditEvents)
    .where(
      and(
        eq(auditEvents.organizationId, organizationId),
        sql`${auditEvents.action} in ('closeout_submitted', 'closeout_resubmitted')`,
      ),
    )
    .orderBy(desc(auditEvents.createdAt));

  const latestSubmitByKey = new Map<string, typeof submitRows[number]>();
  for (const row of submitRows) {
    const metadata = row.metadata as SubmitMetadata;
    const closeoutId = typeof metadata?.closeoutId === "string" ? metadata.closeoutId : "";
    const date = typeof metadata?.date === "string" ? metadata.date : "";
    if (!closeoutId || !date) continue;
    const key = `${row.storeId}|${closeoutId}|${date}`;
    if (!latestSubmitByKey.has(key)) {
      latestSubmitByKey.set(key, row);
    }
  }

  let repaired = 0;

  for (const submit of latestSubmitByKey.values()) {
    const metadata = submit.metadata as SubmitMetadata;
    const closeoutId = metadata.closeoutId!;
    const date = metadata.date!;
    const storeId = submit.storeId;
    if (!storeId) continue;

    const [approvalAfterSubmit] = await db
      .select({ id: auditEvents.id })
      .from(auditEvents)
      .where(
        and(
          eq(auditEvents.organizationId, organizationId),
          eq(auditEvents.storeId, storeId),
          eq(auditEvents.action, "closeout_approved"),
          sql`${auditEvents.metadata} ->> 'closeoutId' = ${closeoutId}`,
          sql`${auditEvents.metadata} ->> 'date' = ${date}`,
          sql`${auditEvents.createdAt} >= ${submit.createdAt}`,
        ),
      )
      .limit(1);

    if (approvalAfterSubmit) continue;

    const entryIds = [
      ...(metadata.summaryEntryId ? [metadata.summaryEntryId] : []),
      ...(metadata.outflowEntryIds || []),
    ];

    await db.transaction(async (tx) => {
      if (entryIds.length > 0) {
        await tx
          .update(entries)
          .set({
            status: "active",
            reviewedAt: new Date(),
          })
          .where(
            and(
              eq(entries.organizationId, organizationId),
              eq(entries.storeId, storeId),
              inArray(entries.id, entryIds),
            ),
          );
      }

      await tx.insert(auditEvents).values({
        organizationId,
        storeId,
        actorUserId: submit.actorUserId,
        action: "closeout_approved",
        reason: null,
        metadata: {
          closeoutId,
          date,
          sourceSubmissionAuditId: submit.id,
          autoReview: true,
          repaired: true,
        },
      });
    });

    repaired += 1;
  }

  return { repaired };
}
