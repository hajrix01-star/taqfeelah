import { and, eq, ne, sql } from "drizzle-orm";
import { z } from "zod";
import { assertStoreAccess } from "@/core/auth/assert-store-access";
import { type MemberRole } from "@/core/auth/roles";
import { getDb } from "@/core/db/client";
import { auditEvents, salesChannels } from "@/core/db/schema";
import { ValidationError } from "@/core/errors/app-error";

const inputSchema = z.object({
  organizationId: z.string().uuid(),
  storeId: z.string().uuid(),
  actorUserId: z.string().uuid(),
  actorRole: z.enum(["owner", "manager", "employee"]),
  salesChannelId: z.string().uuid(),
  status: z.enum(["active", "retired"]),
  reason: z.string().trim().max(500).optional(),
});

export async function updateStoreSalesChannel(rawInput: z.infer<typeof inputSchema>) {
  const parsed = inputSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ValidationError("Invalid sales channel update input.", parsed.error.flatten());
  }
  const input = parsed.data;

  await assertStoreAccess({
    organizationId: input.organizationId,
    storeId: input.storeId,
    actorUserId: input.actorUserId,
    actorRole: input.actorRole as MemberRole,
    minimumRole: "owner",
  });

  const db = getDb();
  const now = new Date();

  return db.transaction(async (tx) => {
    const [existing] = await tx
      .select({
        id: salesChannels.id,
        name: salesChannels.name,
        status: salesChannels.status,
      })
      .from(salesChannels)
      .where(
        and(
          eq(salesChannels.id, input.salesChannelId),
          eq(salesChannels.organizationId, input.organizationId),
          eq(salesChannels.storeId, input.storeId),
        ),
      )
      .limit(1);

    if (!existing) {
      throw new ValidationError("Sales channel was not found for this store.");
    }

    if (input.status === "retired" && existing.status !== "retired") {
      const [activeCounter] = await tx
        .select({ count: sql<number>`count(*)::int` })
        .from(salesChannels)
        .where(
          and(
            eq(salesChannels.organizationId, input.organizationId),
            eq(salesChannels.storeId, input.storeId),
            eq(salesChannels.status, "active"),
            ne(salesChannels.id, existing.id),
          ),
        )
        .limit(1);

      if ((activeCounter?.count || 0) < 1) {
        throw new ValidationError("At least one active sales channel is required per store.");
      }
    }

    const [updated] = await tx
      .update(salesChannels)
      .set({
        status: input.status,
        retiredAt: input.status === "retired" ? now : null,
      })
      .where(eq(salesChannels.id, existing.id))
      .returning({
        id: salesChannels.id,
        name: salesChannels.name,
        status: salesChannels.status,
        retiredAt: salesChannels.retiredAt,
        createdAt: salesChannels.createdAt,
      });

    await tx.insert(auditEvents).values({
      organizationId: input.organizationId,
      storeId: input.storeId,
      actorUserId: input.actorUserId,
      action: input.status === "retired" ? "sales_channel_retired" : "sales_channel_activated",
      reason: input.reason || null,
      metadata: {
        salesChannelId: updated.id,
        name: updated.name,
        previousStatus: existing.status,
        status: updated.status,
      },
    });

    return {
      id: updated.id,
      name: updated.name,
      status: updated.status,
      retiredAt: updated.retiredAt ? updated.retiredAt.toISOString() : null,
      createdAt: updated.createdAt.toISOString(),
    };
  });
}
