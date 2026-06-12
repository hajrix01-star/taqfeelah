import { and, eq } from "drizzle-orm";
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

  return db.transaction(async (tx) => {
    const [duplicate] = await tx
      .select({ id: salesChannels.id })
      .from(salesChannels)
      .where(
        and(
          eq(salesChannels.organizationId, input.organizationId),
          eq(salesChannels.storeId, input.storeId),
          eq(salesChannels.name, input.name),
        ),
      )
      .limit(1);

    if (duplicate?.id) {
      throw new ValidationError("A sales channel with this name already exists for this store.");
    }

    const [created] = await tx
      .insert(salesChannels)
      .values({
        organizationId: input.organizationId,
        storeId: input.storeId,
        name: input.name,
        status: input.status,
        retiredAt: input.status === "retired" ? now : null,
      })
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
      status: created.status,
      retiredAt: created.retiredAt ? created.retiredAt.toISOString() : null,
      createdAt: created.createdAt.toISOString(),
    };
  });
}
