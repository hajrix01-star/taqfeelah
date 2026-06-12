import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/core/db/client";
import { auditEvents, organizations, stores } from "@/core/db/schema";
import { ValidationError } from "@/core/errors/app-error";
import { ERROR_CODES } from "@/core/errors/error-codes";
import { catalogAppError } from "@/core/errors/normalize-error";

const inputSchema = z.object({
  actorUserId: z.string().uuid(),
  organizationId: z.string().uuid(),
  storeId: z.string().uuid(),
  name: z.string().trim().min(1).max(120).optional(),
  location: z.string().trim().max(240).optional(),
  status: z.enum(["active", "archived"]).optional(),
  reason: z.string().trim().max(500).optional(),
});

export async function updateSaasAccountStore(rawInput: z.infer<typeof inputSchema>) {
  const parsed = inputSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ValidationError("Invalid SaaS store update input.", parsed.error.flatten());
  }
  const input = parsed.data;

  if (!input.name && input.location === undefined && !input.status) {
    throw new ValidationError("At least one store field must be provided.");
  }

  const db = getDb();
  const [organization] = await db
    .select({ id: organizations.id })
    .from(organizations)
    .where(eq(organizations.id, input.organizationId))
    .limit(1);

  if (!organization?.id) {
    throw catalogAppError(ERROR_CODES.ORGANIZATION_NOT_FOUND);
  }

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
      throw catalogAppError(ERROR_CODES.STORE_NOT_FOUND);
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
        source: "platform_admin",
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
