import { and, desc, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { assertOrganizationAccess } from "@/core/auth/assert-organization-access";
import { getDb } from "@/core/db/client";
import { auditEvents } from "@/core/db/schema";
import { buildRuntimeApiIdMaps } from "@/core/client/runtime-api-id-maps";
import { getProductionAuthRuntimeConfig } from "@/core/config/env";
import { ValidationError } from "@/core/errors/app-error";
import { enrichStaffWithApiUserIds } from "@/features/auth/server/resolve-employee-user-id";
import { enrichRuntimeStoreIdMap } from "@/features/runtime-settings/server/enrich-runtime-store-id-map";
import { provisionSalesChannels } from "@/features/runtime-settings/server/provision-sales-channels";
import { provisionStaffMembers } from "@/features/runtime-settings/server/provision-staff-members";

const runtimeSettingsEnvelopeSchema = z.object({
  settings: z.record(z.string(), z.unknown()),
  schemaVersion: z.number().int().positive().default(1),
});

const saveSettingsInputSchema = z.object({
  organizationId: z.string().uuid(),
  actorUserId: z.string().uuid(),
  actorRole: z.enum(["owner", "manager", "employee"]),
  settings: z.record(z.string(), z.unknown()),
  reason: z.string().trim().max(500).optional(),
});

const getSettingsInputSchema = z.object({
  organizationId: z.string().uuid(),
  actorUserId: z.string().uuid(),
  actorRole: z.enum(["owner", "manager", "employee"]),
});

type SaveSettingsInput = z.infer<typeof saveSettingsInputSchema>;
type GetSettingsInput = z.infer<typeof getSettingsInputSchema>;

function normalizeRuntimeSettings(settings: Record<string, unknown> | null | undefined) {
  if (!settings || typeof settings !== "object") return null;
  const envAuth = getProductionAuthRuntimeConfig();
  return {
    ...settings,
    staff: enrichStaffWithApiUserIds(settings.staff, envAuth.userIdMap),
  };
}

/** Strip sensitive authConfig fields for non-owner roles */
function redactSettingsForRole(
  settings: Record<string, unknown> | null | undefined,
  actorRole: "owner" | "manager" | "employee",
): Record<string, unknown> | null {
  if (!settings) return null;
  if (actorRole === "owner") return settings;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { authConfig, ...rest } = settings as { authConfig?: unknown; [key: string]: unknown };
  return rest;
}

async function readRuntimeSettingsEnvelope(organizationId: string) {
  const db = getDb();
  const [row] = await db
    .select({
      metadata: auditEvents.metadata,
      createdAt: auditEvents.createdAt,
      actorUserId: auditEvents.actorUserId,
    })
    .from(auditEvents)
    .where(
      and(
        eq(auditEvents.organizationId, organizationId),
        isNull(auditEvents.storeId),
        eq(auditEvents.action, "runtime_settings_saved"),
      ),
    )
    .orderBy(desc(auditEvents.createdAt))
    .limit(1);

  if (!row) {
    return { settings: null, updatedAt: null, updatedByUserId: null };
  }

  const parsedEnvelope = runtimeSettingsEnvelopeSchema.safeParse(row.metadata);
  if (!parsedEnvelope.success) {
    return { settings: null, updatedAt: row.createdAt, updatedByUserId: row.actorUserId };
  }
  return {
    settings: normalizeRuntimeSettings(parsedEnvelope.data.settings),
    schemaVersion: parsedEnvelope.data.schemaVersion,
    updatedAt: row.createdAt,
    updatedByUserId: row.actorUserId,
  };
}

async function assertOrganizationRoleAccess(input: GetSettingsInput, minimumRole: "owner" | "manager" | "employee") {
  await assertOrganizationAccess({
    organizationId: input.organizationId,
    actorUserId: input.actorUserId,
    actorRole: input.actorRole,
    minimumRole,
  });
}

export async function getRuntimeSettings(rawInput: GetSettingsInput) {
  const parsed = getSettingsInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ValidationError("Invalid runtime settings read input.", parsed.error.flatten());
  }
  const input = parsed.data;
  await assertOrganizationRoleAccess(input, "employee");

  const envelope = await readRuntimeSettingsEnvelope(input.organizationId);
  return {
    ...envelope,
    settings: redactSettingsForRole(envelope.settings, input.actorRole as "owner" | "manager" | "employee"),
  };
}

export async function getRuntimeSettingsByOrganizationId(organizationId: string) {
  if (!z.string().uuid().safeParse(organizationId).success) {
    throw new ValidationError("Invalid organization id for runtime settings lookup.");
  }
  return readRuntimeSettingsEnvelope(organizationId);
}

export async function saveRuntimeSettings(rawInput: SaveSettingsInput) {
  const parsed = saveSettingsInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ValidationError("Invalid runtime settings save input.", parsed.error.flatten());
  }
  const input = parsed.data;
  await assertOrganizationRoleAccess(input, "owner");

  const envAuth = getProductionAuthRuntimeConfig();
  const configuredBusinesses = Array.isArray(input.settings.configuredBusinesses)
    ? input.settings.configuredBusinesses
    : [];
  const enrichedStoreIdMap = await enrichRuntimeStoreIdMap(
    input.organizationId,
    envAuth.storeIdMap,
    configuredBusinesses,
  );
  const storeChannelSettings = input.settings.storeChannelSettings
    && typeof input.settings.storeChannelSettings === "object"
    && !Array.isArray(input.settings.storeChannelSettings)
    ? input.settings.storeChannelSettings as Record<string, {
      channels?: { id?: string; apiChannelId?: string }[];
      activeIds?: string[];
    }>
    : {};
  const runtimeApiMaps = buildRuntimeApiIdMaps({
    configuredBusinesses,
    staff: Array.isArray(input.settings.staff) ? input.settings.staff : [],
    storeChannelSettings,
    envStoreIdMap: enrichedStoreIdMap,
    envUserIdMap: envAuth.userIdMap,
    envSalesChannelIdMap: envAuth.salesChannelIdMap,
  });
  const provisionedStaff = await provisionStaffMembers(input.organizationId, input.settings.staff, {
    storeIdMap: runtimeApiMaps.storeIdMap,
    userIdMap: runtimeApiMaps.userIdMap,
  });
  const provisionedStoreChannelSettings = await provisionSalesChannels(
    input.organizationId,
    storeChannelSettings,
    {
      storeIdMap: runtimeApiMaps.storeIdMap,
      salesChannelIdMap: runtimeApiMaps.salesChannelIdMap,
    },
  );
  const normalizedSettings = {
    ...input.settings,
    staff: provisionedStaff,
    storeChannelSettings: provisionedStoreChannelSettings,
  };

  const db = getDb();
  const [saved] = await db
    .insert(auditEvents)
    .values({
      organizationId: input.organizationId,
      storeId: null,
      entryId: null,
      actorUserId: input.actorUserId,
      action: "runtime_settings_saved",
      reason: input.reason || null,
      metadata: {
        settings: normalizedSettings,
        schemaVersion: 1,
      },
    })
    .returning({
      id: auditEvents.id,
      createdAt: auditEvents.createdAt,
    });

  return {
    id: saved.id,
    createdAt: saved.createdAt,
    settings: normalizedSettings,
  };
}

export async function getEmployeeLoginRoster(organizationId: string) {
  const envelope = await readRuntimeSettingsEnvelope(organizationId);
  const staff = Array.isArray(envelope.settings?.staff) ? envelope.settings.staff : [];
  return staff
    .filter((entry) => entry && typeof entry === "object")
    .map((entry) => entry as Record<string, unknown>)
    .filter((person) => person.active !== false && person.removed !== true)
    .map((person) => ({
      id: typeof person.id === "string" ? person.id : "",
      nameAr: typeof person.nameAr === "string" ? person.nameAr : "",
      nameEn: typeof person.nameEn === "string" ? person.nameEn : "",
    }))
    .filter((person) => person.id);
}
