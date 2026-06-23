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
import { closeoutDateSchema } from "@/features/closeouts/server/closeout-date-validation";

const CLOSEOUT_MAX_SALES_CHANNELS = 100;
const CLOSEOUT_MAX_OUTFLOWS = 100;
const CLOSEOUT_MAX_ATTACHMENTS = 20;

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
  date: closeoutDateSchema,
  actorUserId: z.string().uuid(),
  actorRole: z.enum(["owner", "manager", "employee"]),
  closeoutId: z.string().trim().min(1).max(120),
  salesChannels: z.array(salesChannelSchema).max(CLOSEOUT_MAX_SALES_CHANNELS).default([]),
  outflows: z.array(outflowSchema).max(CLOSEOUT_MAX_OUTFLOWS).default([]),
  attachments: z
    .array(z.union([z.string(), closeoutAttachmentSchema]))
    .max(CLOSEOUT_MAX_ATTACHMENTS)
    .optional()
    .default([]),
  note: z.string().trim().max(500).optional(),
  mode: z.preprocess(
    (value) => normalizeCloseoutSubmitMode(value),
    z.enum(["submit", "ownerEdit"]),
  ).default("submit"),
});

type CloseoutSubmitInput = Omit<z.infer<typeof closeoutSubmitSchema>, "mode"> & {
  mode?: CloseoutSubmitModeInput;
};
type ParsedCloseoutSubmitInput = z.infer<typeof closeoutSubmitSchema>;
type NormalizedSalesChannel = Awaited<ReturnType<typeof resolveStoreSalesChannelsForWrite>>[number];
type CloseoutReadExecutor = Pick<ReturnType<typeof getDb>, "select">;

function stableJson(value: unknown): string {
  return JSON.stringify(value);
}

function isUniqueConstraintViolation(error: unknown): boolean {
  const record = error as { code?: unknown; cause?: { code?: unknown } } | null;
  return record?.code === "23505" || record?.cause?.code === "23505";
}

function normalizedChannelSignature(channels: NormalizedSalesChannel[]): string {
  return stableJson(
    channels
      .map((row) => ({
        salesChannelId: row.salesChannelId,
        amountHalalas: row.amountHalalas,
      }))
      .sort((a, b) => `${a.salesChannelId}`.localeCompare(`${b.salesChannelId}`)),
  );
}

function normalizedOutflowSignature(outflows: ParsedCloseoutSubmitInput["outflows"]): string {
  return stableJson(
    outflows
      .map((row) => ({
        type: row.type,
        amountHalalas: row.amountHalalas,
        categoryId: row.categoryId || null,
        note: row.note || null,
      }))
      .sort((a, b) => `${a.type}|${a.categoryId || ""}|${a.note || ""}|${a.amountHalalas}`.localeCompare(
        `${b.type}|${b.categoryId || ""}|${b.note || ""}|${b.amountHalalas}`,
      )),
  );
}

async function resolveExistingSubmitResult(
  dbOrTx: CloseoutReadExecutor,
  input: ParsedCloseoutSubmitInput,
  normalizedChannels: NormalizedSalesChannel[],
) {
  const [existingCloseout] = await dbOrTx
    .select({
      id: dailyCloseouts.id,
      date: dailyCloseouts.date,
      daySequence: dailyCloseouts.daySequence,
    })
    .from(dailyCloseouts)
    .where(
      and(
        eq(dailyCloseouts.organizationId, input.organizationId),
        eq(dailyCloseouts.storeId, input.storeId),
        eq(dailyCloseouts.clientCloseoutId, input.closeoutId),
        eq(dailyCloseouts.status, "approved"),
      ),
    )
    .limit(1);

  if (!existingCloseout) return null;

  const existingEntries = await dbOrTx
    .select({
      id: entries.id,
      type: entries.type,
      amountHalalas: entries.amountHalalas,
      categoryId: entries.categoryId,
      note: entries.note,
    })
    .from(entries)
    .where(
      and(
        eq(entries.organizationId, input.organizationId),
        eq(entries.storeId, input.storeId),
        eq(entries.closeoutId, existingCloseout.id),
        eq(entries.status, "active"),
      ),
    );

  const summaryEntry = existingEntries.find((row: { type: string }) => row.type === "summary");
  if (!summaryEntry) {
    throw new ValidationError("Closeout is already saved, but its financial summary is incomplete.");
  }

  const existingChannels = await dbOrTx
    .select({
      salesChannelId: entrySalesChannels.salesChannelId,
      amountHalalas: entrySalesChannels.amountHalalas,
    })
    .from(entrySalesChannels)
    .where(
      and(
        eq(entrySalesChannels.organizationId, input.organizationId),
        eq(entrySalesChannels.storeId, input.storeId),
        eq(entrySalesChannels.entryId, summaryEntry.id),
      ),
    );

  const existingOutflows = existingEntries
    .filter((row: { type: string }) => row.type !== "summary")
    .map((row: { type: string; amountHalalas: number; categoryId: string | null; note: string | null }) => ({
      type: row.type as "purchases" | "expense" | "withdrawal",
      amountHalalas: row.amountHalalas,
      categoryId: row.categoryId,
      note: row.note || undefined,
    }));

  const channelsMatch = normalizedChannelSignature(existingChannels as NormalizedSalesChannel[])
    === normalizedChannelSignature(normalizedChannels);
  const outflowsMatch = normalizedOutflowSignature(existingOutflows)
    === normalizedOutflowSignature(input.outflows);

  if (!channelsMatch || !outflowsMatch) {
    throw new ValidationError("Closeout is already saved with this closeoutId. Use owner edit to change it.");
  }

  const outflowEntryIds = existingEntries
    .filter((row: { type: string }) => row.type !== "summary")
    .map((row: { id: string }) => row.id);

  return {
    summaryEntryId: summaryEntry.id,
    outflowEntryIds,
    daySequence: existingCloseout.daySequence,
    dailyCloseoutId: existingCloseout.id,
    idempotentReplay: true,
  };
}

function formatCloseoutSubmitValidationMessage(
  error: z.ZodError<CloseoutSubmitInput>,
): string {
  const flattened = error.flatten();
  if (flattened.fieldErrors.date?.length) {
    return "Closeout date cannot be in the future.";
  }
  if (flattened.fieldErrors.attachments?.length) {
    return "Invalid closeout attachment payload.";
  }
  if (flattened.fieldErrors.salesChannels?.length) {
    return "Invalid closeout sales channel payload.";
  }
  if (flattened.fieldErrors.outflows?.length) {
    return "Invalid closeout outflow payload.";
  }
  return "Invalid closeout submit input.";
}

export async function submitStoreCloseout(rawInput: CloseoutSubmitInput) {
  const parsed = closeoutSubmitSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ValidationError(
      formatCloseoutSubmitValidationMessage(parsed.error),
      parsed.error.flatten(),
    );
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

  let txResult: {
    summaryEntryId: string;
    outflowEntryIds: string[];
    daySequence: number;
    dailyCloseoutId: string;
    idempotentReplay?: boolean;
  };

  try {
    txResult = await db.transaction(async (tx) => {
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
            eq(dailyCloseouts.status, "approved"),
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
          voidedByUserId: null,
          voidedAt: null,
          updatedAt: new Date(),
        })
        .where(eq(dailyCloseouts.id, closeoutRowId));
      await tx
        .update(entries)
        .set({
          status: "voided",
          voidedAt: reviewedAt,
          updatedAt: reviewedAt,
        })
        .where(
          and(
            eq(entries.organizationId, input.organizationId),
            eq(entries.storeId, input.storeId),
            eq(entries.closeoutId, closeoutRowId),
            eq(entries.status, "active"),
          ),
        );
    } else {
      const existingSubmitResult = await resolveExistingSubmitResult(tx, input, normalizedChannels);
      if (existingSubmitResult) return existingSubmitResult;

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

    if (normalizedChannels.length > 0) {
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
    }

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
  } catch (error) {
    if (!isOwnerEditCloseoutMode(input.mode) && isUniqueConstraintViolation(error)) {
      const existingSubmitResult = await resolveExistingSubmitResult(db, input, normalizedChannels);
      if (existingSubmitResult) {
        txResult = existingSubmitResult;
      } else {
        throw new ValidationError("Closeout is already saved with this closeoutId.");
      }
    } else {
      throw error;
    }
  }

  const calculated = calculateDaySummary([
    { type: "summary", amountHalalas: totalSalesHalalas },
    ...input.outflows.map((row) => ({ type: row.type, amountHalalas: row.amountHalalas })),
  ]);

  if (!txResult.idempotentReplay) {
    void fireUsageEventSafe({
      organizationId: input.organizationId,
      storeId: input.storeId,
      userId: input.actorUserId,
      eventName: "closeout_submitted",
      eventDate: input.date,
      metadata: { closeoutId: input.closeoutId, mode: input.mode },
    });
  }

  return {
    closeoutId: input.closeoutId,
    date: input.date,
    daySequence: txResult.daySequence,
    summaryEntryId: txResult.summaryEntryId,
    outflowEntryIds: txResult.outflowEntryIds,
    dailyCloseoutId: txResult.dailyCloseoutId,
    idempotentReplay: txResult.idempotentReplay === true ? true : undefined,
    totals: {
      totalSalesHalalas: calculated.totalSalesHalalas,
      totalOutflowHalalas: calculated.totalOutflowHalalas,
      netMovementHalalas: calculated.netMovementHalalas,
      outflowRatio: calculated.outflowRatio,
      outflowRatioStatus: calculated.outflowRatioStatus,
    },
  };
}
