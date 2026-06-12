import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { PROTOTYPE_SALES_CHANNEL_IDS } from "@/core/client/sales-channel-catalog";
import { getDb } from "@/core/db/client";
import { auditEvents, organizations, stores } from "@/core/db/schema";
import { ValidationError } from "@/core/errors/app-error";
import { ERROR_CODES } from "@/core/errors/error-codes";
import { catalogAppError } from "@/core/errors/normalize-error";
import { assertOrganizationEntitlement } from "@/features/billing/server/assert-organization-entitlement";
import { provisionSalesChannels } from "@/features/runtime-settings/server/provision-sales-channels";

const inputSchema = z.object({
  actorUserId: z.string().uuid(),
  organizationId: z.string().uuid(),
  name: z.string().trim().min(1).max(120),
  location: z.string().trim().max(240).optional(),
});

function buildDefaultStoreChannelSettings(storeId: string) {
  const channels = PROTOTYPE_SALES_CHANNEL_IDS.map((id) => ({
    id,
    text: id,
    retired: false,
  }));
  return {
    [storeId]: {
      channels,
      activeIds: [...PROTOTYPE_SALES_CHANNEL_IDS],
    },
  };
}

export async function createSaasAccountStore(rawInput: z.infer<typeof inputSchema>) {
  const parsed = inputSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ValidationError("Invalid SaaS store create input.", parsed.error.flatten());
  }
  const input = parsed.data;

  const db = getDb();
  const [organization] = await db
    .select({ id: organizations.id })
    .from(organizations)
    .where(eq(organizations.id, input.organizationId))
    .limit(1);

  if (!organization?.id) {
    throw catalogAppError(ERROR_CODES.ORGANIZATION_NOT_FOUND);
  }

  await assertOrganizationEntitlement(input.organizationId, "add_store");

  const storeId = randomUUID();
  const now = new Date();

  return db.transaction(async (tx) => {
    const [created] = await tx
      .insert(stores)
      .values({
        id: storeId,
        organizationId: input.organizationId,
        name: input.name,
        location: input.location?.trim() || null,
        status: "active",
        createdAt: now,
        updatedAt: now,
      })
      .returning({
        id: stores.id,
        name: stores.name,
        location: stores.location,
        status: stores.status,
        createdAt: stores.createdAt,
        updatedAt: stores.updatedAt,
      });

    await provisionSalesChannels(
      input.organizationId,
      buildDefaultStoreChannelSettings(storeId),
      {
        storeIdMap: { [storeId]: storeId },
        salesChannelIdMap: {},
        executor: tx,
      },
    );

    await tx.insert(auditEvents).values({
      organizationId: input.organizationId,
      storeId: created.id,
      actorUserId: input.actorUserId,
      action: "saas_store_provisioned",
      metadata: {
        name: created.name,
        location: created.location || "",
        source: "platform_admin",
      },
    });

    return {
      id: created.id,
      name: created.name,
      location: created.location || "",
      status: created.status,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    };
  });
}
