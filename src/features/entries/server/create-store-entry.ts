import { z } from "zod";
import { getDb } from "@/core/db/client";
import { assertStoreAccess } from "@/core/auth/assert-store-access";
import { type MemberRole } from "@/core/auth/roles";
import { ValidationError } from "@/core/errors/app-error";
import { fireUsageEventSafe } from "@/features/usage/server/fire-usage-event-safe";
import { attachments, auditEvents, entries, entrySalesChannels } from "@/core/db/schema";
import { assertCloseoutLinkedEntry, CLOSEOUT_REQUIRED_FOR_ENTRY_MESSAGE } from "@/features/entries/server/assert-closeout-linked-entry";
import {
  INLINE_ATTACHMENT_MAX_BYTES,
  INLINE_ATTACHMENT_MAX_DATA_URL_LENGTH,
} from "@/core/attachments/inline-attachment-limits";
import { registerAttachment } from "@/core/attachments/register-attachment";
import { resolveStoreSalesChannelsForWrite } from "@/features/org-config/server/resolve-store-sales-channels-for-write";

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
  closeoutId: z.string().uuid().optional(),
  salesChannels: z.array(salesChannelSchema).default([]),
  attachment: z
    .object({
      kind: z.literal("image"),
      name: z.string().trim().min(1).max(220).optional(),
      mimeType: z.string().trim().min(1).max(120).default("image/jpeg"),
      sizeBytes: z.number().int().positive().max(INLINE_ATTACHMENT_MAX_BYTES),
      dataUrl: z.string().trim().min(32).max(INLINE_ATTACHMENT_MAX_DATA_URL_LENGTH).optional(),
      storageKey: z.string().trim().min(8).max(512).optional(),
    })
    .refine((value) => Boolean(value.dataUrl || value.storageKey), {
      message: "Attachment requires dataUrl or storageKey.",
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

  const db = getDb();
  const linkedCloseoutId = await assertCloseoutLinkedEntry(db, {
    organizationId: input.organizationId,
    storeId: input.storeId,
    closeoutId: input.closeoutId,
  });
  if (!linkedCloseoutId) {
    throw new ValidationError(CLOSEOUT_REQUIRED_FOR_ENTRY_MESSAGE);
  }
  const normalizedSalesChannels = input.type === "summary"
    ? await resolveStoreSalesChannelsForWrite(
      db,
      input.organizationId,
      input.storeId,
      input.salesChannels.filter((row) => row.amountHalalas > 0),
    )
    : input.salesChannels.filter((row) => row.amountHalalas > 0);
  const totalSalesHalalas = normalizedSalesChannels.reduce((sum, row) => sum + row.amountHalalas, 0);

  if (input.type === "summary" && totalSalesHalalas <= 0) {
    throw new ValidationError("Summary entry requires at least one positive sales channel amount.");
  }
  if (input.type !== "summary" && (!input.amountHalalas || input.amountHalalas <= 0)) {
    throw new ValidationError("Non-summary entry requires a positive amountHalalas.");
  }

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
        closeoutId: linkedCloseoutId,
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
      const normalizedAttachment = await registerAttachment({
        organizationId: input.organizationId,
        storeId: input.storeId,
        kind: input.attachment.kind,
        name: input.attachment.name,
        mimeType: input.attachment.mimeType,
        sizeBytes: input.attachment.sizeBytes,
        dataUrl: input.attachment.dataUrl,
        storageKey: input.attachment.storageKey,
      });
      const storageKey = normalizedAttachment.storageKey;
      if (!storageKey) {
        throw new ValidationError("Attachment requires dataUrl or storageKey.");
      }
      await tx.insert(attachments).values({
        organizationId: input.organizationId,
        storeId: input.storeId,
        entryId: createdEntry.id,
        storageKey,
        originalFileName: normalizedAttachment.name || "attachment.jpg",
        mimeType: normalizedAttachment.mimeType || "image/jpeg",
        sizeBytes: normalizedAttachment.sizeBytes,
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

  void fireUsageEventSafe({
    organizationId: input.organizationId,
    storeId: input.storeId,
    userId: input.actorUserId,
    eventName: "entry_created",
    eventDate: input.date,
    metadata: { type: input.type, entryId: result.id },
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
