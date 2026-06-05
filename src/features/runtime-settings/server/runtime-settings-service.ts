import { and, desc, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/core/db/client";
import { auditEvents, organizationMembers } from "@/core/db/schema";
import { getProductionAuthRuntimeConfig } from "@/core/config/env";
import { ForbiddenError, ValidationError } from "@/core/errors/app-error";
import { enrichStaffWithApiUserIds } from "@/features/auth/server/resolve-employee-user-id";
import { provisionStaffMembers } from "@/features/runtime-settings/server/provision-staff-members";

const rolePriority: Record<"owner" | "manager" | "employee", number> = {
  employee: 1,
  manager: 2,
  owner: 3,
};

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
  const db = getDb();
  const [member] = await db
    .select({
      role: organizationMembers.role,
      status: organizationMembers.status,
    })
    .from(organizationMembers)
    .where(
      and(
        eq(organizationMembers.organizationId, input.organizationId),
        eq(organizationMembers.userId, input.actorUserId),
        eq(organizationMembers.status, "active"),
      ),
    )
    .limit(1);

  if (!member) {
    throw new ForbiddenError("User is not an active organization member.");
  }

  const normalizedRole = member.role === "owner" || member.role === "manager" ? member.role : "employee";
  if (rolePriority[normalizedRole] < rolePriority[minimumRole]) {
    throw new ForbiddenError("Insufficient role for runtime settings action.");
  }
}

export async function getRuntimeSettings(rawInput: GetSettingsInput) {
  const parsed = getSettingsInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ValidationError("Invalid runtime settings read input.", parsed.error.flatten());
  }
  const input = parsed.data;
  await assertOrganizationRoleAccess(input, "employee");
  return readRuntimeSettingsEnvelope(input.organizationId);
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
  const provisionedStaff = await provisionStaffMembers(input.organizationId, input.settings.staff, {
    storeIdMap: envAuth.storeIdMap,
    userIdMap: envAuth.userIdMap,
  });
  const normalizedSettings = {
    ...input.settings,
    staff: provisionedStaff,
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
