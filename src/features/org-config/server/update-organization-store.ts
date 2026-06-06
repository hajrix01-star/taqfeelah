import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { assertOrganizationAccess } from "@/core/auth/assert-organization-access";
import { getDb } from "@/core/db/client";
import { auditEvents, stores } from "@/core/db/schema";
import { ValidationError } from "@/core/errors/app-error";

const inputSchema = z.object({
  organizationId: z.string().uuid(),
  storeId: z.string().uuid(),
  actorUserId: z.string().uuid(),
  actorRole: z.enum(["owner", "manager", "employee"]),
  name: z.string().trim().min(1).max(120).optional(),
  location: z.string().trim().max(240).optional(),
  status: z.enum(["active", "archived"]).optional(),
  reason: z.string().trim().max(500).optional(),
});

export async function updateOrganizationStore(rawInput: z.infer<typeof inputSchema>) {
  const parsed = inputSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ValidationError("Invalid store update input.", parsed.error.flatten());
  }
  const input = parsed.data;

  if (!input.name && input.location === undefined && !input.status) {
    throw new ValidationError("At least one store field must be provided.");
  }

  await assertOrganizationAccess({
    organizationId: input.organizationId,
    actorUserId: input.actorUserId,
    actorRole: input.actorRole,
    minimumRole: "owner",
  });

  const db = getDb();
  const now = new Date();

  return db.transaction(async (tx) => {
    const [existing] = await tx
      .select({
        id: stores.id,
        name: stores.name,
        location: stores.location,
        status: stores.status,
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

    const nextStatus = input.status || existing.status;
    const [updated] = await tx
      .update(stores)
      .set({
        name: input.name ?? existing.name,
        location: input.location === undefined ? existing.location : (input.location || null),
        status: nextStatus,
        updatedAt: now,
      })
      .where(eq(stores.id, input.storeId))
      .returning({
        id: stores.id,
        name: stores.name,
        location: stores.location,
        status: stores.status,
        createdAt: stores.createdAt,
        updatedAt: stores.updatedAt,
      });

    const auditAction = nextStatus === "archived" && existing.status !== "archived"
      ? "store_archived"
      : "store_updated";

    await tx.insert(auditEvents).values({
      organizationId: input.organizationId,
      storeId: updated.id,
      actorUserId: input.actorUserId,
      action: auditAction,
      reason: input.reason || null,
      metadata: {
        previousStatus: existing.status,
        status: updated.status,
        name: updated.name,
        location: updated.location || "",
      },
    });

    return {
      id: updated.id,
      name: updated.name,
      location: updated.location || "",
      status: updated.status,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  });
}
