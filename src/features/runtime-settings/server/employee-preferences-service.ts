import { z } from "zod";
import { assertOrganizationAccess } from "@/core/auth/assert-organization-access";
import { getDb } from "@/core/db/client";
import { auditEvents } from "@/core/db/schema";
import { ForbiddenError, ValidationError } from "@/core/errors/app-error";
import { isValidNotebookTheme } from "@/features/daily-closeouts/notebook-themes";
import { getRuntimeSettingsByOrganizationId } from "@/features/runtime-settings/server/runtime-settings-service";

const employeePreferencesSchema = z.object({
  notebookTheme: z.string().trim().min(1).nullable().optional(),
}).strict();

const actorInputSchema = z.object({
  organizationId: z.string().uuid(),
  actorUserId: z.string().uuid(),
  actorRole: z.enum(["owner", "manager", "employee"]),
});

const saveEmployeePreferencesInputSchema = actorInputSchema.extend({
  preferences: employeePreferencesSchema,
});

type ActorInput = z.infer<typeof actorInputSchema>;
type SaveEmployeePreferencesInput = z.infer<typeof saveEmployeePreferencesInputSchema>;

export type EmployeePreferencesPayload = {
  notebookTheme: string | null;
};

function assertSelfServiceRole(actorRole: ActorInput["actorRole"]) {
  if (actorRole === "owner") {
    throw new ForbiddenError("Owners must use runtime settings to manage preferences.");
  }
}

function readEmployeePreferencesFromSettings(
  settings: Record<string, unknown> | null | undefined,
  userId: string,
): EmployeePreferencesPayload {
  const employeePreferences = settings?.employeePreferences;
  if (!employeePreferences || typeof employeePreferences !== "object" || Array.isArray(employeePreferences)) {
    return { notebookTheme: null };
  }
  const userPrefs = (employeePreferences as Record<string, unknown>)[userId];
  if (!userPrefs || typeof userPrefs !== "object" || Array.isArray(userPrefs)) {
    return { notebookTheme: null };
  }
  const notebookTheme = (userPrefs as { notebookTheme?: unknown }).notebookTheme;
  if (typeof notebookTheme === "string" && isValidNotebookTheme(notebookTheme)) {
    return { notebookTheme };
  }
  return { notebookTheme: null };
}

function validatePreferencePatch(preferences: z.infer<typeof employeePreferencesSchema>) {
  if (preferences.notebookTheme === undefined) return;
  if (preferences.notebookTheme === null) return;
  if (!isValidNotebookTheme(preferences.notebookTheme)) {
    throw new ValidationError("Invalid notebook theme.");
  }
}

async function persistRuntimeSettingsSnapshot(input: {
  organizationId: string;
  actorUserId: string;
  settings: Record<string, unknown>;
  reason: string;
}) {
  const db = getDb();
  const [saved] = await db
    .insert(auditEvents)
    .values({
      organizationId: input.organizationId,
      storeId: null,
      entryId: null,
      actorUserId: input.actorUserId,
      action: "runtime_settings_saved",
      reason: input.reason,
      metadata: {
        settings: input.settings,
        schemaVersion: 1,
      },
    })
    .returning({
      id: auditEvents.id,
      createdAt: auditEvents.createdAt,
    });

  return saved;
}

export async function getEmployeePreferences(rawInput: ActorInput): Promise<EmployeePreferencesPayload> {
  const parsed = actorInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ValidationError("Invalid employee preferences read input.", parsed.error.flatten());
  }
  const input = parsed.data;
  assertSelfServiceRole(input.actorRole);
  await assertOrganizationAccess({
    organizationId: input.organizationId,
    actorUserId: input.actorUserId,
    actorRole: input.actorRole,
    minimumRole: "employee",
  });

  const envelope = await getRuntimeSettingsByOrganizationId(input.organizationId);
  return readEmployeePreferencesFromSettings(
    envelope.settings as Record<string, unknown> | null | undefined,
    input.actorUserId,
  );
}

export async function saveEmployeePreferences(
  rawInput: SaveEmployeePreferencesInput,
): Promise<EmployeePreferencesPayload> {
  const parsed = saveEmployeePreferencesInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ValidationError("Invalid employee preferences save input.", parsed.error.flatten());
  }
  const input = parsed.data;
  assertSelfServiceRole(input.actorRole);
  validatePreferencePatch(input.preferences);
  await assertOrganizationAccess({
    organizationId: input.organizationId,
    actorUserId: input.actorUserId,
    actorRole: input.actorRole,
    minimumRole: "employee",
  });

  const envelope = await getRuntimeSettingsByOrganizationId(input.organizationId);
  const currentSettings = (
    envelope.settings && typeof envelope.settings === "object" && !Array.isArray(envelope.settings)
      ? envelope.settings
      : {}
  ) as Record<string, unknown>;

  const currentEmployeePreferences = (
    currentSettings.employeePreferences
    && typeof currentSettings.employeePreferences === "object"
    && !Array.isArray(currentSettings.employeePreferences)
      ? currentSettings.employeePreferences
      : {}
  ) as Record<string, unknown>;

  const currentUserPrefs = (
    currentEmployeePreferences[input.actorUserId]
    && typeof currentEmployeePreferences[input.actorUserId] === "object"
    && !Array.isArray(currentEmployeePreferences[input.actorUserId])
      ? currentEmployeePreferences[input.actorUserId]
      : {}
  ) as Record<string, unknown>;

  const nextUserPrefs = { ...currentUserPrefs };
  if (input.preferences.notebookTheme !== undefined) {
    nextUserPrefs.notebookTheme = input.preferences.notebookTheme;
  }

  const nextSettings: Record<string, unknown> = {
    ...currentSettings,
    employeePreferences: {
      ...currentEmployeePreferences,
      [input.actorUserId]: nextUserPrefs,
    },
  };

  await persistRuntimeSettingsSnapshot({
    organizationId: input.organizationId,
    actorUserId: input.actorUserId,
    settings: nextSettings,
    reason: "employee_preferences_saved",
  });

  return readEmployeePreferencesFromSettings(nextSettings, input.actorUserId);
}
