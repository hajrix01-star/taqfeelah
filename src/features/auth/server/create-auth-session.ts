import { and, eq, ilike, or } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/core/db/client";
import { organizationMembers, users } from "@/core/db/schema";
import { getProductionAuthRuntimeConfig } from "@/core/config/env";
import { UnauthorizedError, ValidationError } from "@/core/errors/app-error";
import { getRuntimeSettingsByOrganizationId } from "@/features/runtime-settings/server/runtime-settings-service";
import { resolveEmployeeUserId } from "@/features/auth/server/resolve-employee-user-id";

const loginInputSchema = z.object({
  mode: z.enum(["owner_password", "employee_pin"]),
  username: z.string().optional(),
  password: z.string().optional(),
  employeeId: z.string().optional(),
  pin: z.string().optional(),
});

type LoginInput = z.infer<typeof loginInputSchema>;

function normalize(value: string | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

function isUuid(value: string): boolean {
  return z.string().uuid().safeParse(value).success;
}

const authConfigSchema = z.object({
  ownerUsername: z.string().trim().min(1).optional(),
  ownerPassword: z.string().trim().min(1).optional(),
  employeePins: z.record(z.string(), z.string()).optional(),
});

const BOOTSTRAP_OWNER_USERNAME = "hajri";
const BOOTSTRAP_OWNER_PASSWORD = "123";
const BOOTSTRAP_EMPLOYEE_PINS: Record<string, string> = {
  ahmed: "1234",
  sara: "1234",
};

type StaffPerson = {
  id?: string;
  nameAr?: string;
  nameEn?: string;
};

async function resolveEmployeeUserIdWithFallback(
  employeeId: string,
  userIdMap: Record<string, string>,
  runtimeSettings: Record<string, unknown> | null | undefined,
  organizationId: string,
): Promise<string> {
  const mapped = resolveEmployeeUserId(employeeId, userIdMap, runtimeSettings);
  if (mapped) return mapped;

  const staff = Array.isArray(runtimeSettings?.staff)
    ? runtimeSettings.staff.filter((entry): entry is StaffPerson => Boolean(entry && typeof entry === "object"))
    : [];
  const normalized = normalize(employeeId);
  const person = staff.find((entry) => entry.id === normalized);
  if (!person) return "";

  const nameCandidates = [person.nameEn, person.nameAr]
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter(Boolean);
  if (nameCandidates.length === 0) return "";

  const db = getDb();
  const [member] = await db
    .select({
      userId: organizationMembers.userId,
    })
    .from(organizationMembers)
    .innerJoin(users, eq(users.id, organizationMembers.userId))
    .where(
      and(
        eq(organizationMembers.organizationId, organizationId),
        eq(organizationMembers.status, "active"),
        eq(organizationMembers.role, "employee"),
        or(...nameCandidates.map((name) => ilike(users.name, name))),
      ),
    )
    .limit(1);

  return member?.userId && isUuid(member.userId) ? member.userId : "";
}

export async function createAuthSession(rawInput: LoginInput) {
  const parsed = loginInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ValidationError("Invalid login payload.", parsed.error.flatten());
  }
  const input = parsed.data;
  const envAuth = getProductionAuthRuntimeConfig();
  const organizationId = envAuth.organizationId;
  const ownerUserId = envAuth.ownerUserId;
  const userIdMap = envAuth.userIdMap;

  if (!isUuid(organizationId)) {
    throw new ValidationError("Auth organization ID is not configured.");
  }

  const runtimeSettingsEnvelope = await getRuntimeSettingsByOrganizationId(organizationId);
  const runtimeSettings = runtimeSettingsEnvelope?.settings || null;
  const parsedAuthConfig = authConfigSchema.safeParse(runtimeSettings?.authConfig || {});
  const runtimeAuthConfig = parsedAuthConfig.success ? parsedAuthConfig.data : {};

  const ownerUsername = runtimeAuthConfig.ownerUsername || envAuth.ownerUsername || BOOTSTRAP_OWNER_USERNAME;
  const ownerPassword = runtimeAuthConfig.ownerPassword || envAuth.ownerPassword || BOOTSTRAP_OWNER_PASSWORD;
  const employeePinMap = {
    ...BOOTSTRAP_EMPLOYEE_PINS,
    ...envAuth.employeePinMap,
    ...(runtimeAuthConfig.employeePins || {}),
  };

  if (!ownerUserId) {
    throw new ValidationError("Owner user mapping is not configured.");
  }

  let userId = "";
  let role: "owner" | "employee" = "employee";

  if (input.mode === "owner_password") {
    const username = normalize(input.username).toLowerCase();
    const password = normalize(input.password);
    if (!ownerUsername || !ownerPassword) {
      throw new ValidationError("Owner auth configuration is incomplete.");
    }
    if (username !== ownerUsername.trim().toLowerCase() || password !== ownerPassword) {
      throw new UnauthorizedError("Invalid credentials.");
    }
    userId = ownerUserId;
    role = "owner";
  } else {
    const employeeId = normalize(input.employeeId);
    const pin = normalize(input.pin);
    if (!employeeId || !pin) {
      throw new ValidationError("employeeId and pin are required.");
    }
    const mappedUserId = await resolveEmployeeUserIdWithFallback(
      employeeId,
      userIdMap,
      runtimeSettings,
      organizationId,
    );
    if (!mappedUserId) {
      throw new UnauthorizedError("Employee account mapping is invalid.");
    }
    const expectedPin =
      employeePinMap[employeeId]
      || employeePinMap[employeeId.toLowerCase()]
      || employeePinMap[mappedUserId];
    if (!expectedPin || pin !== expectedPin) {
      throw new UnauthorizedError("Invalid employee pin.");
    }
    userId = mappedUserId;
    role = "employee";
  }

  const db = getDb();
  const [member] = await db
    .select({
      userId: organizationMembers.userId,
      role: organizationMembers.role,
      status: organizationMembers.status,
    })
    .from(organizationMembers)
    .where(
      and(
        eq(organizationMembers.organizationId, organizationId),
        eq(organizationMembers.userId, userId),
        eq(organizationMembers.status, "active"),
      ),
    )
    .limit(1);

  if (!member) {
    throw new UnauthorizedError("User is not an active organization member.");
  }
  if (role === "owner" && member.role !== "owner") {
    throw new UnauthorizedError("Owner credentials are not linked to an owner member.");
  }
  const resolvedMemberRole: "owner" | "manager" | "employee" = member.role === "owner"
    ? "owner"
    : member.role === "manager"
      ? "manager"
      : "employee";

  return {
    organizationId,
    userId,
    role: role === "owner" ? "owner" : resolvedMemberRole,
  };
}
