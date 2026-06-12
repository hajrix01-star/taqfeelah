import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/core/db/client";
import { auditEvents, salesChannels } from "@/core/db/schema";
import { ValidationError } from "@/core/errors/app-error";
import { assertSaasStoreBelongsToOrg } from "@/features/saas-admin/server/assert-saas-store-belongs-to-org";

const inputSchema = z.object({
  actorUserId: z.string().uuid(),
  organizationId: z.string().uuid(),
  storeId: z.string().uuid(),
  salesChannelId: z.string().uuid(),
  status: z.enum(["active", "retired"]),
  reason: z.string().trim().max(500).optional(),
});

export async function updateSaasAccountStoreSalesChannel(rawInput: z.infer<typeof inputSchema>) {
  const parsed = inputSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ValidationError("Invalid sales channel update input.", parsed.error.flatten());
  }
  const input = parsed.data;

  const db = getDb();
  const now = new Date();

  return db.transaction(async (tx) => {
    await assertSaasStoreBelongsToOrg(tx, input.organizationId, input.storeId);

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
        source: "platform_admin",
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
