import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/core/db/client";
import { auditEvents, dailyCloseouts, entries, entrySalesChannels } from "@/core/db/schema";
import { calculateDaySummary } from "@/domain/cash-movement/calculations";
import { type MemberRole } from "@/core/auth/roles";
import { ForbiddenError, ValidationError } from "@/core/errors/app-error";
import { assertStoreAccess } from "@/core/auth/assert-store-access";
import { resolveCloseoutDaySequence } from "@/features/closeouts/server/resolve-closeout-day-sequence";
import { fireUsageEventSafe } from "@/features/usage/server/fire-usage-event-safe";
import { resolveStoreSalesChannelsForWrite } from "@/features/org-config/server/resolve-store-sales-channels-for-write";
import { closeoutAttachmentSchema } from "@/features/closeouts/server/closeout-attachment-input";
import {
  normalizeCloseoutLevelAttachments,
  normalizeOutflowAttachments,
  persistCloseoutEntryAttachments,
} from "@/features/closeouts/server/persist-closeout-entry-attachments";
import {
  isOwnerEditCloseoutMode,
  normalizeCloseoutSubmitMode,
  type CloseoutSubmitModeInput,
} from "@/features/closeouts/closeout-submit-mode";

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
  attachments: z.array(z.union([z.string(), closeoutAttachmentSchema])).optional(),
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
  attachments: z.array(z.union([z.string(), closeoutAttachmentSchema])).optional().default([]),
  note: z.string().trim().max(500).optional(),
  mode: z.preprocess(
    (value) => normalizeCloseoutSubmitMode(value),
    z.enum(["submit", "ownerEdit"]),
  ).default("submit"),
});

type CloseoutSubmitInput = Omit<z.infer<typeof closeoutSubmitSchema>, "mode"> & {
  mode?: CloseoutSubmitModeInput;
};

export async function submitStoreCloseout(rawInput: CloseoutSubmitInput) {
  const parsed = closeoutSubmitSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ValidationError("Invalid closeout submit input.", parsed.error.flatten());
  }

  const input = parsed.data;
  if (isOwnerEditCloseoutMode(input.mode) && input.actorRole === "employee") {
    throw new ForbiddenError("Only owner or manager can edit a submitted closeout.");
  }

  await assertStoreAccess({
    organizationId: input.organizationId,
    storeId: input.storeId,
    actorUserId: input.actorUserId,
    actorRole: input.actorRole as MemberRole,
    minimumRole: "employee",
  });

  const db = getDb();
  const normalizedChannels = await resolveStoreSalesChannelsForWrite(
    db,
    input.organizationId,
    input.storeId,
    input.salesChannels.filter((row) => row.amountHalalas > 0),
  );
  const totalSalesHalalas = normalizedChannels.reduce((sum, row) => sum + row.amountHalalas, 0);
  const totalOutflowHalalas = input.outflows.reduce((sum, row) => sum + row.amountHalalas, 0);
  const ownerOutflowOnly = totalSalesHalalas <= 0
    && totalOutflowHalalas > 0
    && (input.actorRole === "owner" || input.actorRole === "manager");

  if (totalSalesHalalas <= 0 && !ownerOutflowOnly) {
    throw new ValidationError("Closeout must include at least one positive sales channel amount.");
  }

  const reviewedAt = new Date();

  const txResult = await db.transaction(async (tx) => {
    const daySequence = await resolveCloseoutDaySequence(tx as Parameters<typeof resolveCloseoutDaySequence>[0], {
      organizationId: input.organizationId,
      storeId: input.storeId,
      date: input.date,
      closeoutId: input.closeoutId,
      mode: input.mode,
    });

    let closeoutRowId: string;

    if (isOwnerEditCloseoutMode(input.mode)) {
      const [existingCloseout] = await tx
        .select({ id: dailyCloseouts.id })
        .from(dailyCloseouts)
        .where(
          and(
            eq(dailyCloseouts.organizationId, input.organizationId),
            eq(dailyCloseouts.storeId, input.storeId),
            eq(dailyCloseouts.clientCloseoutId, input.closeoutId),
          ),
        )
        .limit(1);

      if (!existingCloseout) {
        throw new ValidationError("Closeout not found for owner edit.");
      }

      closeoutRowId = existingCloseout.id;
      await tx
        .update(dailyCloseouts)
        .set({
          status: "approved",
          submittedByUserId: input.actorUserId,
          reviewedByUserId: input.actorUserId,
          reviewedAt,
          returnReason: null,
          note: input.note || null,
          updatedAt: new Date(),
        })
        .where(eq(dailyCloseouts.id, closeoutRowId));
      await tx
        .delete(entries)
        .where(
          and(
            eq(entries.organizationId, input.organizationId),
            eq(entries.storeId, input.storeId),
            eq(entries.closeoutId, closeoutRowId),
          ),
        );
    } else {
      const [insertedCloseout] = await tx
        .insert(dailyCloseouts)
        .values({
          organizationId: input.organizationId,
          storeId: input.storeId,
          date: input.date,
          daySequence,
          clientCloseoutId: input.closeoutId,
          status: "approved",
          submittedByUserId: input.actorUserId,
          reviewedByUserId: input.actorUserId,
          reviewedAt,
          note: input.note || null,
        })
        .returning({ id: dailyCloseouts.id });

      closeoutRowId = insertedCloseout.id;
    }

    const [summaryEntry] = await tx
      .insert(entries)
      .values({
        organizationId: input.organizationId,
        storeId: input.storeId,
        closeoutId: closeoutRowId,
        date: input.date,
        type: "summary",
        amountHalalas: totalSalesHalalas,
        currency: "SAR",
        note: input.note || null,
        enteredByUserId: input.actorUserId,
        status: "active",
        reviewedAt,
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

    const closeoutLevelAttachments = normalizeCloseoutLevelAttachments(input.attachments);
    if (closeoutLevelAttachments.length > 0) {
      await persistCloseoutEntryAttachments(tx as Parameters<typeof persistCloseoutEntryAttachments>[0], {
        organizationId: input.organizationId,
        storeId: input.storeId,
        entryId: summaryEntry.id,
        attachments: closeoutLevelAttachments,
      });
    }

    const outflowEntries = input.outflows.length
      ? await tx
        .insert(entries)
        .values(
          input.outflows.map((row) => ({
            organizationId: input.organizationId,
            storeId: input.storeId,
            closeoutId: closeoutRowId,
            date: input.date,
            type: row.type,
            amountHalalas: row.amountHalalas,
            currency: "SAR",
            categoryId: row.categoryId || null,
            note: row.note || null,
            enteredByUserId: input.actorUserId,
            status: "active",
            reviewedAt,
          })),
        )
        .returning({ id: entries.id, type: entries.type, amountHalalas: entries.amountHalalas })
      : [];

    if (outflowEntries.length > 0) {
      await Promise.all(
        outflowEntries.map((entryRow, index) => {
          const outflowAttachments = normalizeOutflowAttachments(input.outflows[index]?.attachments);
          if (!outflowAttachments.length) return Promise.resolve();
          return persistCloseoutEntryAttachments(tx as Parameters<typeof persistCloseoutEntryAttachments>[0], {
            organizationId: input.organizationId,
            storeId: input.storeId,
            entryId: entryRow.id,
            attachments: outflowAttachments,
          });
        }),
      );
    }

    await tx.insert(auditEvents).values({
      organizationId: input.organizationId,
      storeId: input.storeId,
      actorUserId: input.actorUserId,
      entryId: summaryEntry.id,
      action: isOwnerEditCloseoutMode(input.mode) ? "closeout_resubmitted" : "closeout_submitted",
      reason: input.note || null,
      metadata: {
        closeoutId: input.closeoutId,
        dailyCloseoutId: closeoutRowId,
        date: input.date,
        daySequence,
        summaryEntryId: summaryEntry.id,
        outflowEntryIds: outflowEntries.map((row) => row.id),
        totalSalesHalalas,
        totalOutflowHalalas,
      },
    });

    return {
      summaryEntryId: summaryEntry.id,
      outflowEntryIds: outflowEntries.map((row) => row.id),
      daySequence,
      dailyCloseoutId: closeoutRowId,
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
    dailyCloseoutId: txResult.dailyCloseoutId,
    totals: {
      totalSalesHalalas: calculated.totalSalesHalalas,
      totalOutflowHalalas: calculated.totalOutflowHalalas,
      netMovementHalalas: calculated.netMovementHalalas,
      outflowRatio: calculated.outflowRatio,
      outflowRatioStatus: calculated.outflowRatioStatus,
    },
  };
}
