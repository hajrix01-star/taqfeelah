import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { assertStoreAccess } from "@/core/auth/assert-store-access";
import { type MemberRole } from "@/core/auth/roles";
import { getDb } from "@/core/db/client";
import { auditEvents, entries } from "@/core/db/schema";
import { ValidationError } from "@/core/errors/app-error";
import { createStoreEntry } from "@/features/entries/server/create-store-entry";

const salesChannelSchema = z.object({
  salesChannelId: z.string().uuid(),
  channelName: z.string().trim().min(1).max(120),
  amountHalalas: z.number().int().nonnegative(),
});

const payloadSchema = z.object({
  type: z.literal("summary"),
  amountHalalas: z.number().int().positive().optional(),
  note: z.string().trim().max(500).optional(),
  salesChannels: z.array(salesChannelSchema).default([]),
  attachment: z
    .object({
      kind: z.literal("image").default("image"),
      name: z.string().trim().min(1).max(220).optional(),
      mimeType: z.string().trim().min(1).max(120).default("image/jpeg"),
      sizeBytes: z.number().int().positive().max(350 * 1024),
      dataUrl: z.string().trim().min(32).max(500_000).optional(),
      storageKey: z.string().trim().min(8).max(500_000).optional(),
    })
    .optional(),
});

const inputSchema = z.object({
  organizationId: z.string().uuid(),
  storeId: z.string().uuid(),
  actorUserId: z.string().uuid(),
  actorRole: z.enum(["owner", "manager", "employee"]),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  payload: payloadSchema,
});

export async function approveDuplicateSummary(rawInput: z.infer<typeof inputSchema>) {
  const parsed = inputSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ValidationError("Invalid duplicate summary approve input.", parsed.error.flatten());
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
  const existingRows = await db
    .select({ id: entries.id })
    .from(entries)
    .where(
      and(
        eq(entries.organizationId, input.organizationId),
        eq(entries.storeId, input.storeId),
        eq(entries.date, input.date),
        eq(entries.type, "summary"),
        eq(entries.status, "active"),
      ),
    );

  if (!existingRows.length) {
    throw new ValidationError("No active summary exists for this store and date.");
  }

  const created = await createStoreEntry({
    organizationId: input.organizationId,
    storeId: input.storeId,
    actorUserId: input.actorUserId,
    actorRole: input.actorRole,
    date: input.date,
    type: "summary",
    note: input.payload.note,
    salesChannels: input.payload.salesChannels,
    attachment: input.payload.attachment,
  });

  await db.insert(auditEvents).values({
    organizationId: input.organizationId,
    storeId: input.storeId,
    entryId: created.id,
    actorUserId: input.actorUserId,
    action: "duplicate_approved",
    metadata: {
      date: input.date,
      previousEntryIds: existingRows.map((row) => row.id),
      createdEntryId: created.id,
    },
  });

  return created;
}
