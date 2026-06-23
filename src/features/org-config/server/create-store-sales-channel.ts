import { and, eq, sql } from "drizzle-orm";
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
  name: z.string().trim().min(1).max(120),
  kind: z.enum(["payment_method", "sales_channel"]).default("payment_method"),
  status: z.enum(["active", "retired"]).default("active"),
  reason: z.string().trim().max(500).optional(),
});

export async function createStoreSalesChannel(rawInput: z.infer<typeof inputSchema>) {
  const parsed = inputSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ValidationError("Invalid sales channel create input.", parsed.error.flatten());
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
  const normalizedName = input.name.trim();

  return db.transaction(async (tx) => {
    const [existing] = await tx
      .select({
        id: salesChannels.id,
        name: salesChannels.name,
        kind: salesChannels.kind,
        status: salesChannels.status,
        retiredAt: salesChannels.retiredAt,
        createdAt: salesChannels.createdAt,
      })
      .from(salesChannels)
      .where(
        and(
          eq(salesChannels.organizationId, input.organizationId),
          eq(salesChannels.storeId, input.storeId),
          sql`lower(btrim(${salesChannels.name})) = lower(btrim(${normalizedName}))`,
        ),
      )
      .limit(1);

    if (existing?.id) {
      const nextStatus = input.status;
      const nextRetiredAt = nextStatus === "retired" ? now : null;

      const [updated] = await tx
        .update(salesChannels)
        .set({
          name: normalizedName,
          kind: input.kind,
          status: nextStatus,
          retiredAt: nextRetiredAt,
        })
        .where(eq(salesChannels.id, existing.id))
        .returning({
          id: salesChannels.id,
          name: salesChannels.name,
          kind: salesChannels.kind,
          status: salesChannels.status,
          retiredAt: salesChannels.retiredAt,
          createdAt: salesChannels.createdAt,
        });

      await tx.insert(auditEvents).values({
        organizationId: input.organizationId,
        storeId: input.storeId,
        actorUserId: input.actorUserId,
        action: existing.status === "retired" && updated.status === "active"
          ? "sales_channel_reactivated"
          : "sales_channel_upserted",
        reason: input.reason || null,
        metadata: {
          salesChannelId: updated.id,
          previousStatus: existing.status,
          status: updated.status,
          kind: updated.kind,
          name: updated.name,
        },
      });

      return {
        id: updated.id,
        name: updated.name,
        kind: updated.kind,
        status: updated.status,
        retiredAt: updated.retiredAt ? updated.retiredAt.toISOString() : null,
        createdAt: updated.createdAt.toISOString(),
      };
    }

    const [created] = await tx
      .insert(salesChannels)
      .values({
        organizationId: input.organizationId,
        storeId: input.storeId,
        name: normalizedName,
        kind: input.kind,
        status: input.status,
        retiredAt: input.status === "retired" ? now : null,
      })
      .returning({
        id: salesChannels.id,
        name: salesChannels.name,
        kind: salesChannels.kind,
        status: salesChannels.status,
        retiredAt: salesChannels.retiredAt,
        createdAt: salesChannels.createdAt,
      });

    await tx.insert(auditEvents).values({
      organizationId: input.organizationId,
      storeId: input.storeId,
      actorUserId: input.actorUserId,
      action: "sales_channel_created",
      reason: input.reason || null,
      metadata: {
        salesChannelId: created.id,
        name: created.name,
        status: created.status,
      },
    });

    return {
      id: created.id,
      name: created.name,
      kind: created.kind,
      status: created.status,
      retiredAt: created.retiredAt ? created.retiredAt.toISOString() : null,
      createdAt: created.createdAt.toISOString(),
    };
  });
}
