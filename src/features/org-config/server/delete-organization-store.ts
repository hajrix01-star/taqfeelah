import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { assertOrganizationAccess } from "@/core/auth/assert-organization-access";
import { getDb } from "@/core/db/client";
import { auditEvents, dailyCloseouts, entries, stores } from "@/core/db/schema";
import { ValidationError } from "@/core/errors/app-error";

const inputSchema = z.object({
  organizationId: z.string().uuid(),
  storeId: z.string().uuid(),
  actorUserId: z.string().uuid(),
  actorRole: z.enum(["owner", "manager", "employee"]),
  reason: z.string().trim().max(500).optional(),
});

export async function deleteOrganizationStore(rawInput: z.infer<typeof inputSchema>) {
  const parsed = inputSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ValidationError("Invalid store delete input.", parsed.error.flatten());
  }
  const input = parsed.data;

  await assertOrganizationAccess({
    organizationId: input.organizationId,
    actorUserId: input.actorUserId,
    actorRole: input.actorRole,
    minimumRole: "owner",
  });

  const db = getDb();

  return db.transaction(async (tx) => {
    const [existing] = await tx
      .select({
        id: stores.id,
        name: stores.name,
      })
      .from(stores)
      .where(
        and(
          eq(stores.id, input.storeId),
          eq(stores.organizationId, input.organizationId),
        ),
      )
      .limit(1);

    if (!existing) {
      throw new ValidationError("Store was not found for this organization.");
    }

    const [recordsCounter] = await tx
      .select({
        closeoutsCount: sql<number>`count(*)::int`,
      })
      .from(dailyCloseouts)
      .where(
        and(
          eq(dailyCloseouts.organizationId, input.organizationId),
          eq(dailyCloseouts.storeId, input.storeId),
        ),
      )
      .limit(1);

    const [entriesCounter] = await tx
      .select({
        entriesCount: sql<number>`count(*)::int`,
      })
      .from(entries)
      .where(
        and(
          eq(entries.organizationId, input.organizationId),
          eq(entries.storeId, input.storeId),
        ),
      )
      .limit(1);

    if ((recordsCounter?.closeoutsCount || 0) > 0 || (entriesCounter?.entriesCount || 0) > 0) {
      throw new ValidationError("Store has operational records and cannot be deleted.");
    }

    await tx.delete(stores).where(eq(stores.id, input.storeId));

    await tx.insert(auditEvents).values({
      organizationId: input.organizationId,
      storeId: null,
      actorUserId: input.actorUserId,
      action: "store_deleted",
      reason: input.reason || null,
      metadata: {
        deletedStoreId: existing.id,
        deletedStoreName: existing.name,
      },
    });

    return {
      id: existing.id,
      deleted: true,
    };
  });
}