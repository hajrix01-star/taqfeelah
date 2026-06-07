import { z } from "zod";
import { getDb } from "@/core/db/client";
import { auditEvents, entries, entrySalesChannels } from "@/core/db/schema";
import { calculateDaySummary } from "@/domain/cash-movement/calculations";
import { type MemberRole } from "@/core/auth/roles";
import { ValidationError } from "@/core/errors/app-error";
import { assertStoreAccess } from "@/core/auth/assert-store-access";
import { resolveCloseoutAutoReview } from "@/features/closeouts/server/closeout-review-policy";
import { resolveCloseoutDaySequence } from "@/features/closeouts/server/resolve-closeout-day-sequence";
import { readStoreOperationalSettingsRecord } from "@/features/org-config/server/read-store-operational-settings";
import { fireUsageEventSafe } from "@/features/usage/server/fire-usage-event-safe";

const salesChannelSchema = z.object({
  salesChannelId: z.string().uuid(),
  channelName: z.string().trim().min(1).max(120),
  amountHalalas: z.number().int().nonnegative(),
});

const outflowSchema = z.object({
  type: z.enum(["purchases", "expense", "withdrawal"]),
  amountHalalas: z.coerce.number().int().positive(),
  categoryId: z.string().uuid().optional().nullable(),
  categoryName: z.string().trim().max(120).optional(),
  typeLabel: z.string().trim().max(120).optional(),
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
  /** When true, employee closeout stays pending until owner review. Omitted/false = auto-approve (product default). */
  requireReview: z.boolean().optional(),
});

type CloseoutSubmitInput = z.infer<typeof closeoutSubmitSchema>;

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
  const db = getDb();
  const operationalSettings = await readStoreOperationalSettingsRecord(
    db,
    input.organizationId,
    input.storeId,
  );
  const canAutoReview = resolveCloseoutAutoReview({
    actorRole: input.actorRole as MemberRole,
    closeoutReviewEnabled: operationalSettings.closeoutReviewEnabled,
    autoReview: input.autoReview,
  });
  const initialEntryStatus = canAutoReview ? "active" : "voided";
  const initialReviewedAt = canAutoReview ? new Date() : null;

  const txResult = await db.transaction(async (tx) => {
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

    const daySequence = await resolveCloseoutDaySequence(tx as Parameters<typeof resolveCloseoutDaySequence>[0], {
      organizationId: input.organizationId,
      storeId: input.storeId,
      date: input.date,
      closeoutId: input.closeoutId,
      mode: input.mode,
    });

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
        daySequence,
        summaryEntryId: summaryEntry.id,
        outflowEntryIds: outflowEntries.map((row) => row.id),
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
          categoryName: row.categoryName || "",
          typeLabel: row.typeLabel || "",
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
      daySequence,
    };
  });

  const calculated = calculateDaySummary([
    { type: "summary", amountHalalas: totalSalesHalalas },
    ...input.outflows.map((row) => ({ type: row.type, amountHalalas: row.amountHalalas })),
  ]);

  void fireUsageEventSafe({
    organizationId: input.organizationId,
    storeId: input.storeId,
    userId: input.actorUserId,
    eventName: "closeout_submitted",
    eventDate: input.date,
    metadata: { closeoutId: input.closeoutId, mode: input.mode },
  });

  return {
    closeoutId: input.closeoutId,
    date: input.date,
    daySequence: txResult.daySequence,
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
