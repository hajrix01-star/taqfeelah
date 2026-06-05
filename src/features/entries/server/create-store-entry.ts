import { z } from "zod";
import { getDb } from "@/core/db/client";
import { assertStoreAccess } from "@/core/auth/assert-store-access";
import { type MemberRole } from "@/core/auth/roles";
import { ValidationError } from "@/core/errors/app-error";
import { attachments, auditEvents, entries, entrySalesChannels } from "@/core/db/schema";

const salesChannelSchema = z.object({
  salesChannelId: z.string().uuid(),
  channelName: z.string().trim().min(1).max(120),
  amountHalalas: z.number().int().nonnegative(),
});

const createEntryInputSchema = z.object({
  organizationId: z.string().uuid(),
  storeId: z.string().uuid(),
  actorUserId: z.string().uuid(),
  actorRole: z.enum(["owner", "manager", "employee"]),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD"),
  type: z.enum(["summary", "purchases", "expense", "withdrawal"]),
  amountHalalas: z.number().int().positive().optional(),
  categoryId: z.string().uuid().nullable().optional(),
  note: z.string().trim().max(500).optional(),
  salesChannels: z.array(salesChannelSchema).default([]),
  attachment: z
    .object({
      kind: z.literal("image"),
      name: z.string().trim().min(1).max(220).optional(),
      mimeType: z.string().trim().min(1).max(120).default("image/jpeg"),
      sizeBytes: z.number().int().positive().max(350 * 1024),
      dataUrl: z.string().trim().min(32).max(500_000),
    })
    .optional(),
});

type CreateEntryInput = z.infer<typeof createEntryInputSchema>;

export async function createStoreEntry(rawInput: CreateEntryInput) {
  const parsed = createEntryInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ValidationError("Invalid create entry input.", parsed.error.flatten());
  }
  const input = parsed.data;

  await assertStoreAccess({
    organizationId: input.organizationId,
    storeId: input.storeId,
    actorUserId: input.actorUserId,
    actorRole: input.actorRole as MemberRole,
    minimumRole: "employee",
  });

  const normalizedSalesChannels = input.salesChannels.filter((row) => row.amountHalalas > 0);
  const totalSalesHalalas = normalizedSalesChannels.reduce((sum, row) => sum + row.amountHalalas, 0);

  if (input.type === "summary" && totalSalesHalalas <= 0) {
    throw new ValidationError("Summary entry requires at least one positive sales channel amount.");
  }
  if (input.type !== "summary" && (!input.amountHalalas || input.amountHalalas <= 0)) {
    throw new ValidationError("Non-summary entry requires a positive amountHalalas.");
  }

  const db = getDb();
  const result = await db.transaction(async (tx) => {
    const amountHalalas = input.type === "summary" ? totalSalesHalalas : input.amountHalalas!;
    const [createdEntry] = await tx
      .insert(entries)
      .values({
        organizationId: input.organizationId,
        storeId: input.storeId,
        date: input.date,
        type: input.type,
        amountHalalas,
        currency: "SAR",
        categoryId: input.type === "summary" ? null : (input.categoryId || null),
        note: input.note || null,
        enteredByUserId: input.actorUserId,
        status: "active",
      })
      .returning({
        id: entries.id,
        date: entries.date,
        createdAt: entries.createdAt,
        type: entries.type,
        amountHalalas: entries.amountHalalas,
        categoryId: entries.categoryId,
        note: entries.note,
        status: entries.status,
      });

    if (input.type === "summary" && normalizedSalesChannels.length > 0) {
      await tx.insert(entrySalesChannels).values(
        normalizedSalesChannels.map((row) => ({
          organizationId: input.organizationId,
          storeId: input.storeId,
          entryId: createdEntry.id,
          salesChannelId: row.salesChannelId,
          channelNameSnapshot: row.channelName,
          amountHalalas: row.amountHalalas,
        })),
      );
    }

    if (input.attachment) {
      await tx.insert(attachments).values({
        organizationId: input.organizationId,
        storeId: input.storeId,
        entryId: createdEntry.id,
        storageKey: input.attachment.dataUrl,
        originalFileName: input.attachment.name || "attachment.jpg",
        mimeType: input.attachment.mimeType || "image/jpeg",
        sizeBytes: input.attachment.sizeBytes,
      });
    }

    await tx.insert(auditEvents).values({
      organizationId: input.organizationId,
      storeId: input.storeId,
      entryId: createdEntry.id,
      actorUserId: input.actorUserId,
      action: "entry_created",
      reason: input.note || null,
      metadata: {
        date: input.date,
        type: input.type,
        amountHalalas,
        categoryId: input.categoryId || null,
        hasAttachment: Boolean(input.attachment),
        salesChannels:
          input.type === "summary"
            ? normalizedSalesChannels.map((row) => ({
              salesChannelId: row.salesChannelId,
              channelName: row.channelName,
              amountHalalas: row.amountHalalas,
            }))
            : [],
      },
    });

    return {
      ...createdEntry,
      salesChannels: normalizedSalesChannels,
    };
  });

  return {
    id: result.id,
    date: result.date,
    createdAt: result.createdAt,
    type: result.type,
    amountHalalas: result.amountHalalas,
    categoryId: result.categoryId,
    note: result.note || "",
    status: result.status,
    salesChannels: result.salesChannels,
  };
}
