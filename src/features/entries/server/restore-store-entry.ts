import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { assertStoreAccess } from "@/core/auth/assert-store-access";
import { type MemberRole } from "@/core/auth/roles";
import { getDb } from "@/core/db/client";
import { ValidationError } from "@/core/errors/app-error";
import { auditEvents, entries } from "@/core/db/schema";

const restoreEntryInputSchema = z.object({
  organizationId: z.string().uuid(),
  storeId: z.string().uuid(),
  entryId: z.string().uuid(),
  actorUserId: z.string().uuid(),
  actorRole: z.enum(["owner", "manager", "employee"]),
  reason: z.string().trim().max(500).optional(),
});

type RestoreEntryInput = z.infer<typeof restoreEntryInputSchema>;

export async function restoreStoreEntry(rawInput: RestoreEntryInput) {
  const parsed = restoreEntryInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ValidationError("Invalid restore entry input.", parsed.error.flatten());
  }
  const input = parsed.data;

  await assertStoreAccess({
    organizationId: input.organizationId,
    storeId: input.storeId,
    actorUserId: input.actorUserId,
    actorRole: input.actorRole as MemberRole,
    minimumRole: "manager",
  });

  const db = getDb();
  const [target] = await db
    .select({
      id: entries.id,
      status: entries.status,
      type: entries.type,
      amountHalalas: entries.amountHalalas,
      date: entries.date,
    })
    .from(entries)
    .where(
      and(
        eq(entries.organizationId, input.organizationId),
        eq(entries.storeId, input.storeId),
        eq(entries.id, input.entryId),
      ),
    )
    .limit(1);

  if (!target) {
    throw new ValidationError("Entry was not found.");
  }
  if (target.status !== "voided") {
    throw new ValidationError("Only voided entries can be restored.");
  }

  const now = new Date();
  const [updated] = await db.transaction(async (tx) => {
    const [updatedEntry] = await tx
      .update(entries)
      .set({ status: "active", restoredAt: now, updatedAt: now })
      .where(
        and(
          eq(entries.organizationId, input.organizationId),
          eq(entries.storeId, input.storeId),
          eq(entries.id, input.entryId),
        ),
      )
      .returning({ id: entries.id, status: entries.status, restoredAt: entries.restoredAt });

    await tx.insert(auditEvents).values({
      organizationId: input.organizationId,
      storeId: input.storeId,
      entryId: input.entryId,
      actorUserId: input.actorUserId,
      action: "entry_restored",
      reason: input.reason || null,
      metadata: {
        entryId: input.entryId,
        entryType: target.type,
        amountHalalas: target.amountHalalas,
        date: target.date,
        restoredFromStatus: target.status,
      },
    });

    return [updatedEntry];
  });

  return updated;
}
