import { randomUUID } from "node:crypto";
import { z } from "zod";
import { assertOrganizationAccess } from "@/core/auth/assert-organization-access";
import { getDb } from "@/core/db/client";
import { auditEvents, stores } from "@/core/db/schema";
import { ValidationError } from "@/core/errors/app-error";
import { assertOrganizationEntitlement } from "@/features/billing/server/assert-organization-entitlement";
import { buildCatalogUuidMap } from "@/core/client/income-source-catalog";
import { buildDefaultStoreChannelSettings } from "@/features/org-config/server/build-default-store-channel-settings";
import { provisionSalesChannels } from "@/features/runtime-settings/server/provision-sales-channels";

const inputSchema = z.object({
  organizationId: z.string().uuid(),
  actorUserId: z.string().uuid(),
  actorRole: z.enum(["owner", "manager", "employee"]),
  name: z.string().trim().min(1).max(120),
  location: z.string().trim().max(240).optional(),
});

export async function createOrganizationStore(rawInput: z.infer<typeof inputSchema>) {
  const parsed = inputSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ValidationError("Invalid store create input.", parsed.error.flatten());
  }
  const input = parsed.data;

  await assertOrganizationAccess({
    organizationId: input.organizationId,
    actorUserId: input.actorUserId,
    actorRole: input.actorRole,
    minimumRole: "owner",
  });

  await assertOrganizationEntitlement(input.organizationId, "add_store");

  const db = getDb();
  const storeId = randomUUID();
  const now = new Date();

  return db.transaction(async (tx) => {
    await assertOrganizationEntitlement(input.organizationId, "add_store", { usageExecutor: tx });

    const [created] = await tx
      .insert(stores)
      .values({
        id: storeId,
        organizationId: input.organizationId,
        name: input.name,
        location: input.location || null,
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

    await tx.insert(auditEvents).values({
      organizationId: input.organizationId,
      storeId: created.id,
      actorUserId: input.actorUserId,
      action: "store_created",
      metadata: {
        name: created.name,
        location: created.location || "",
      },
    });

    await provisionSalesChannels(
      input.organizationId,
      buildDefaultStoreChannelSettings(created.id),
      {
        storeIdMap: { [created.id]: created.id },
        salesChannelIdMap: buildCatalogUuidMap(),
        executor: tx,
      },
    );

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
