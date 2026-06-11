import { and, asc, eq } from "drizzle-orm";
import { getDb } from "@/core/db/client";
import { auditEvents, organizationMembers, stores, users } from "@/core/db/schema";
import { readRawRuntimeSettingsEnvelope } from "@/features/runtime-settings/server/runtime-settings-service";
import { provisionSaasAccountFoundation } from "@/features/saas-admin/server/provision-saas-account-foundation";

export async function resolveOrganizationOwnerName(organizationId: string): Promise<string> {
  const db = getDb();
  const [owner] = await db
    .select({
      name: users.name,
    })
    .from(organizationMembers)
    .innerJoin(users, eq(users.id, organizationMembers.userId))
    .where(
      and(
        eq(organizationMembers.organizationId, organizationId),
        eq(organizationMembers.status, "active"),
        eq(organizationMembers.role, "owner"),
      ),
    )
    .orderBy(asc(organizationMembers.createdAt))
    .limit(1);

  return owner?.name?.trim() || "";
}

export function mergeCanonicalOwnerProfileIntoSettings(
  settings: Record<string, unknown> | null | undefined,
  canonicalOwnerName: string,
): Record<string, unknown> | null {
  const trimmed = canonicalOwnerName.trim();
  if (!settings || typeof settings !== "object") {
    return trimmed ? { ownerProfile: { name: trimmed } } : null;
  }

  const currentProfile = settings.ownerProfile;
  const currentName = (
    currentProfile
    && typeof currentProfile === "object"
    && typeof (currentProfile as { name?: string }).name === "string"
  )
    ? (currentProfile as { name: string }).name.trim()
    : "";

  if (currentName === trimmed) return settings;

  return {
    ...settings,
    ownerProfile: {
      ...(currentProfile && typeof currentProfile === "object" ? currentProfile : {}),
      name: trimmed,
    },
  };
}

type SyncRuntimeOwnerProfileInput = {
  organizationId: string;
  actorUserId: string;
  reason: string;
};

export async function syncRuntimeOwnerProfileForOrganization(input: SyncRuntimeOwnerProfileInput) {
  const db = getDb();
  const ownerName = await resolveOrganizationOwnerName(input.organizationId);
  if (!ownerName) {
    return {
      organizationId: input.organizationId,
      synced: false,
      action: "owner_not_found" as const,
      ownerName: "",
    };
  }

  const [owner] = await db
    .select({ userId: users.id })
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

  const envelope = await readRawRuntimeSettingsEnvelope(input.organizationId);
  if (!envelope.settings) {
    const [store] = await db
      .select({ id: stores.id, name: stores.name })
      .from(stores)
      .where(
        and(
          eq(stores.organizationId, input.organizationId),
          eq(stores.status, "active"),
        ),
      )
      .orderBy(asc(stores.createdAt))
      .limit(1);

    if (!store?.id || !owner?.userId) {
      return {
        organizationId: input.organizationId,
        synced: false,
        action: "foundation_missing_dependencies" as const,
        ownerName,
      };
    }

    await db.transaction(async (tx) => {
      await provisionSaasAccountFoundation(
        {
          organizationId: input.organizationId,
          actorUserId: input.actorUserId,
          ownerUserId: owner.userId,
          ownerName,
          storeId: store.id,
          storeName: store.name,
        },
        tx,
      );
    });

    return {
      organizationId: input.organizationId,
      synced: true,
      action: "provisioned_runtime_foundation" as const,
      ownerName,
    };
  }

  const currentSettings = envelope.settings as Record<string, unknown>;
  const mergedSettings = mergeCanonicalOwnerProfileIntoSettings(currentSettings, ownerName);
  const currentOwnerProfile = currentSettings.ownerProfile as { name?: string } | undefined;
  if (currentOwnerProfile?.name?.trim() === ownerName) {
    return {
      organizationId: input.organizationId,
      synced: false,
      action: "already_consistent" as const,
      ownerName,
    };
  }

  await db.insert(auditEvents).values({
    organizationId: input.organizationId,
    actorUserId: input.actorUserId,
    action: "runtime_settings_saved",
    reason: input.reason,
    metadata: {
      settings: mergedSettings,
      schemaVersion: 1,
    },
  });

  return {
    organizationId: input.organizationId,
    synced: true,
    action: "updated_owner_profile" as const,
    ownerName,
  };
}
