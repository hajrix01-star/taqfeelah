import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { assertOrganizationAccess } from "@/core/auth/assert-organization-access";
import { getDb } from "@/core/db/client";
import { auditEvents, stores } from "@/core/db/schema";
import { ValidationError } from "@/core/errors/app-error";
import { mergeStoreOperationalSettings, normalizeStoreOperationalSettings } from "@/domain/store-operational-settings/normalize";
import { storeOperationalSettingsPatchSchema } from "@/domain/store-operational-settings/schema";
import { readStoreOperationalSettingsRecord } from "@/features/org-config/server/read-store-operational-settings";

const inputSchema = z.object({
  organizationId: z.string().uuid(),
  storeId: z.string().uuid(),
  actorUserId: z.string().uuid(),
  actorRole: z.enum(["owner", "manager", "employee"]),
  patch: storeOperationalSettingsPatchSchema,
  reason: z.string().trim().max(500).optional(),
});

export async function updateStoreOperationalSettings(rawInput: z.infer<typeof inputSchema>) {
  const parsed = inputSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ValidationError("Invalid store operational settings input.", parsed.error.flatten());
  }
  const input = parsed.data;

  if (!Object.keys(input.patch).length) {
    throw new ValidationError("At least one operational settings field must be provided.");
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
        operationalSettings: stores.operationalSettings,
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

    const previous = normalizeStoreOperationalSettings(existing.operationalSettings);
    const next = mergeStoreOperationalSettings(previous, input.patch);

    const [updated] = await tx
      .update(stores)
      .set({
        operationalSettings: next,
        updatedAt: now,
      })
      .where(eq(stores.id, input.storeId))
      .returning({
        id: stores.id,
        operationalSettings: stores.operationalSettings,
        updatedAt: stores.updatedAt,
      });

    await tx.insert(auditEvents).values({
      organizationId: input.organizationId,
      storeId: updated.id,
      actorUserId: input.actorUserId,
      action: "store_operational_settings_updated",
      reason: input.reason || null,
      metadata: {
        previous,
        next: normalizeStoreOperationalSettings(updated.operationalSettings),
      },
    });

    return {
      storeId: updated.id,
      operationalSettings: normalizeStoreOperationalSettings(updated.operationalSettings),
      updatedAt: updated.updatedAt.toISOString(),
    };
  });
}

export async function getStoreOperationalSettings(rawInput: {
  organizationId: string;
  storeId: string;
  actorUserId: string;
  actorRole: "owner" | "manager" | "employee";
}) {
  const parsed = z.object({
    organizationId: z.string().uuid(),
    storeId: z.string().uuid(),
    actorUserId: z.string().uuid(),
    actorRole: z.enum(["owner", "manager", "employee"]),
  }).safeParse(rawInput);

  if (!parsed.success) {
    throw new ValidationError("Invalid store operational settings read input.", parsed.error.flatten());
  }

  await assertOrganizationAccess({
    organizationId: parsed.data.organizationId,
    actorUserId: parsed.data.actorUserId,
    actorRole: parsed.data.actorRole,
    minimumRole: "employee",
  });

  const settings = await readStoreOperationalSettingsRecord(
    getDb(),
    parsed.data.organizationId,
    parsed.data.storeId,
  );

  return {
    storeId: parsed.data.storeId,
    operationalSettings: settings,
  };
}
