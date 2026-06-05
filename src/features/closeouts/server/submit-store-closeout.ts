import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/core/db/client";
import { auditEvents, entries, entrySalesChannels } from "@/core/db/schema";
import { calculateDaySummary } from "@/domain/cash-movement/calculations";
import { type MemberRole } from "@/core/auth/roles";
import { ValidationError } from "@/core/errors/app-error";
import { assertStoreAccess } from "@/core/auth/assert-store-access";

const salesChannelSchema = z.object({
  salesChannelId: z.string().uuid(),
  channelName: z.string().trim().min(1).max(120),
  amountHalalas: z.number().int().nonnegative(),
});

const outflowSchema = z.object({
  type: z.enum(["purchases", "expense", "withdrawal"]),
  amountHalalas: z.number().int().positive(),
  categoryId: z.string().uuid().optional().nullable(),
  note: z.string().trim().max(500).optional(),
});

const closeoutSubmitSchema = z.object({
  organizationId: z.string().uuid(),
  storeId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD"),
  actorUserId: z.string().uuid(),
  actorRole: z.enum(["owner", "manager", "employee"]),
  closeoutId: z.string().trim().min(1).max(120),
  salesChannels: z.array(salesChannelSchema).default([]),
  outflows: z.array(outflowSchema).default([]),
  note: z.string().trim().max(500).optional(),
  mode: z.enum(["submit", "resubmit"]).default("submit"),
  autoReview: z.boolean().default(false),
});

const priorSubmitMetadataSchema = z.object({
  summaryEntryId: z.string().uuid().optional(),
  outflowEntryIds: z.array(z.string().uuid()).optional(),
});

type CloseoutSubmitInput = z.infer<typeof closeoutSubmitSchema>;

async function findPriorApprovedEntryIds(
  organizationId: string,
  storeId: string,
  closeoutId: string,
  date: string,
): Promise<string[]> {
  const db = getDb();
  const allSubmits = await db
    .select({
      id: auditEvents.id,
      metadata: auditEvents.metadata,
    })
    .from(auditEvents)
    .where(
      and(
        eq(auditEvents.organizationId, organizationId),
        eq(auditEvents.storeId, storeId),
        sql`${auditEvents.action} in ('closeout_submitted', 'closeout_resubmitted')`,
        sql`${auditEvents.metadata} ->> 'closeoutId' = ${closeoutId}`,
        sql`${auditEvents.metadata} ->> 'date' = ${date}`,
      ),
    )
    .orderBy(desc(auditEvents.createdAt));

  const entryIds: string[] = [];
  for (const row of allSubmits) {
    const parsed = priorSubmitMetadataSchema.safeParse(row.metadata);
    if (!parsed.success) continue;
    if (parsed.data.summaryEntryId) entryIds.push(parsed.data.summaryEntryId);
    for (const id of parsed.data.outflowEntryIds || []) entryIds.push(id);
  }
  return entryIds;
}

export async function submitStoreCloseout(rawInput: CloseoutSubmitInput) {
  const parsed = closeoutSubmitSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ValidationError("Invalid closeout submit input.", parsed.error.flatten());
  }

  const input = parsed.data;
  await assertStoreAccess({
    organizationId: input.organizationId,
    storeId: input.storeId,
    actorUserId: input.actorUserId,
    actorRole: input.actorRole as MemberRole,
    minimumRole: "employee",
  });

  const normalizedChannels = input.salesChannels.filter((row) => row.amountHalalas > 0);
  const totalSalesHalalas = normalizedChannels.reduce((sum, row) => sum + row.amountHalalas, 0);
  if (totalSalesHalalas <= 0) {
    throw new ValidationError("Closeout must include at least one positive sales channel amount.");
  }

  const totalOutflowHalalas = input.outflows.reduce((sum, row) => sum + row.amountHalalas, 0);
  const canAutoReview = input.autoReview && (input.actorRole === "owner" || input.actorRole === "manager");
  const initialEntryStatus = canAutoReview ? "active" : "voided";
  const initialReviewedAt = canAutoReview ? new Date() : null;

  // On resubmit: void all entries from previous submissions for this closeoutId
  // to prevent double-counting when a prior submission was already approved.
  const priorEntryIds = input.mode === "resubmit"
    ? await findPriorApprovedEntryIds(
      input.organizationId,
      input.storeId,
      input.closeoutId,
      input.date,
    )
    : [];

  const db = getDb();
  const txResult = await db.transaction(async (tx) => {
    // Void all prior entries for this closeout before inserting the new submission
    if (priorEntryIds.length > 0) {
      await tx
        .update(entries)
        .set({ status: "voided", reviewedAt: null })
        .where(
          and(
            eq(entries.organizationId, input.organizationId),
            eq(entries.storeId, input.storeId),
            inArray(entries.id, priorEntryIds),
          ),
        );
    }

    const [summaryEntry] = await tx
      .insert(entries)
      .values({
        organizationId: input.organizationId,
        storeId: input.storeId,
        date: input.date,
        type: "summary",
        amountHalalas: totalSalesHalalas,
        currency: "SAR",
        note: input.note || null,
        enteredByUserId: input.actorUserId,
        status: initialEntryStatus,
        reviewedAt: initialReviewedAt,
      })
      .returning({ id: entries.id });

    await tx.insert(entrySalesChannels).values(
      normalizedChannels.map((row) => ({
        organizationId: input.organizationId,
        storeId: input.storeId,
        entryId: summaryEntry.id,
        salesChannelId: row.salesChannelId,
        channelNameSnapshot: row.channelName,
        amountHalalas: row.amountHalalas,
      })),
    );

    const outflowEntries = input.outflows.length
      ? await tx
        .insert(entries)
        .values(
          input.outflows.map((row) => ({
            organizationId: input.organizationId,
            storeId: input.storeId,
            date: input.date,
            type: row.type,
            amountHalalas: row.amountHalalas,
            currency: "SAR",
            categoryId: row.categoryId || null,
            note: row.note || null,
            enteredByUserId: input.actorUserId,
            status: initialEntryStatus,
            reviewedAt: initialReviewedAt,
          })),
        )
        .returning({ id: entries.id, type: entries.type, amountHalalas: entries.amountHalalas })
      : [];

    await tx.insert(auditEvents).values({
      organizationId: input.organizationId,
      storeId: input.storeId,
      actorUserId: input.actorUserId,
      entryId: summaryEntry.id,
      action: input.mode === "resubmit" ? "closeout_resubmitted" : "closeout_submitted",
      reason: input.note || null,
      metadata: {
        closeoutId: input.closeoutId,
        date: input.date,
        summaryEntryId: summaryEntry.id,
        outflowEntryIds: outflowEntries.map((row) => row.id),
        supersededEntryIds: priorEntryIds,
        totalSalesHalalas,
        totalOutflowHalalas,
        salesChannels: normalizedChannels.map((row) => ({
          salesChannelId: row.salesChannelId,
          channelName: row.channelName,
          amountHalalas: row.amountHalalas,
        })),
        outflows: input.outflows.map((row) => ({
          type: row.type,
          amountHalalas: row.amountHalalas,
          categoryId: row.categoryId || null,
          note: row.note || "",
        })),
        note: input.note || "",
      },
    });

    if (canAutoReview) {
      await tx.insert(auditEvents).values({
        organizationId: input.organizationId,
        storeId: input.storeId,
        actorUserId: input.actorUserId,
        action: "closeout_approved",
        reason: null,
        metadata: {
          closeoutId: input.closeoutId,
          date: input.date,
          sourceSubmissionAuditId: null,
          autoReview: true,
        },
      });
    }

    return {
      summaryEntryId: summaryEntry.id,
      outflowEntryIds: outflowEntries.map((row) => row.id),
      supersededEntryIds: priorEntryIds,
    };
  });

  const calculated = calculateDaySummary([
    { type: "summary", amountHalalas: totalSalesHalalas },
    ...input.outflows.map((row) => ({ type: row.type, amountHalalas: row.amountHalalas })),
  ]);

  return {
    closeoutId: input.closeoutId,
    date: input.date,
    summaryEntryId: txResult.summaryEntryId,
    outflowEntryIds: txResult.outflowEntryIds,
    totals: {
      totalSalesHalalas: calculated.totalSalesHalalas,
      totalOutflowHalalas: calculated.totalOutflowHalalas,
      netMovementHalalas: calculated.netMovementHalalas,
      outflowRatio: calculated.outflowRatio,
      outflowRatioStatus: calculated.outflowRatioStatus,
    },
  };
}
