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
        status: "active",
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
            status: "active",
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
        totalSalesHalalas,
        totalOutflowHalalas,
      },
    });

    return {
      summaryEntryId: summaryEntry.id,
      outflowEntryIds: outflowEntries.map((row) => row.id),
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
