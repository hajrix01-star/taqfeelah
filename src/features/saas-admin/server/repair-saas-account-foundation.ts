import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";
import { assertPlatformAdminAccess } from "@/core/auth/assert-platform-admin-access";
import { getDb } from "@/core/db/client";
import { auditEvents, organizationMembers, stores, users } from "@/core/db/schema";
import { ValidationError } from "@/core/errors/app-error";
import { getRuntimeSettingsByOrganizationId } from "@/features/runtime-settings/server/runtime-settings-service";
import { provisionSaasAccountFoundation } from "@/features/saas-admin/server/provision-saas-account-foundation";

const inputSchema = z.object({
  actorUserId: z.string().uuid(),
  organizationId: z.string().uuid(),
});

export async function repairSaasAccountFoundation(rawInput: z.infer<typeof inputSchema>) {
  const parsed = inputSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ValidationError("Invalid SaaS account repair input.", parsed.error.flatten());
  }
  const input = parsed.data;
  assertPlatformAdminAccess({ actorUserId: input.actorUserId });

  const db = getDb();
  const [owner] = await db
    .select({
      userId: users.id,
      name: users.name,
    })
    .from(organizationMembers)
    .innerJoin(users, eq(users.id, organizationMembers.userId))
    .where(
      and(
        eq(organizationMembers.organizationId, input.organizationId),
        eq(organizationMembers.role, "owner"),
        eq(organizationMembers.status, "active"),
      ),
    )
    .limit(1);

  if (!owner?.userId) {
    throw new ValidationError("Active owner was not found for this organization.");
  }

  const [store] = await db
    .select({
      id: stores.id,
      name: stores.name,
    })
    .from(stores)
    .where(
      and(
        eq(stores.organizationId, input.organizationId),
        eq(stores.status, "active"),
      ),
    )
    .orderBy(asc(stores.createdAt))
    .limit(1);

  if (!store?.id) {
    throw new ValidationError("Active store was not found for this organization.");
  }

  const envelope = await getRuntimeSettingsByOrganizationId(input.organizationId);
  if (!envelope.settings) {
    await db.transaction(async (tx) => {
      await provisionSaasAccountFoundation(
        {
          organizationId: input.organizationId,
          actorUserId: input.actorUserId,
          ownerUserId: owner.userId,
          ownerName: owner.name,
          storeId: store.id,
          storeName: store.name,
        },
        tx,
      );
    });
    return {
      organizationId: input.organizationId,
      repaired: true,
      action: "provisioned_runtime_foundation",
      ownerName: owner.name,
      storeId: store.id,
    };
  }

  const currentSettings = envelope.settings as Record<string, unknown>;
  const currentOwnerProfile = currentSettings.ownerProfile as { name?: string } | undefined;
  if (currentOwnerProfile?.name?.trim() === owner.name.trim()) {
    return {
      organizationId: input.organizationId,
      repaired: false,
      action: "already_consistent",
      ownerName: owner.name,
      storeId: store.id,
    };
  }

  await db.insert(auditEvents).values({
    organizationId: input.organizationId,
    actorUserId: input.actorUserId,
    action: "runtime_settings_saved",
    reason: "saas_account_owner_profile_repair",
    metadata: {
      settings: {
        ...currentSettings,
        ownerProfile: {
          ...(currentOwnerProfile && typeof currentOwnerProfile === "object" ? currentOwnerProfile : {}),
          name: owner.name.trim(),
        },
      },
      schemaVersion: 1,
    },
  });

  return {
    organizationId: input.organizationId,
    repaired: true,
    action: "updated_owner_profile",
    ownerName: owner.name,
    storeId: store.id,
  };
}
