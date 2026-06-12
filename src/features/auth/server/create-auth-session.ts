import { and, eq, ilike, or } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/core/db/client";
import { organizationMembers, users } from "@/core/db/schema";
import { isAuthDbCredentialsEnabled } from "@/core/config/auth-api-mode";
import { getProductionAuthRuntimeConfig } from "@/core/config/env";
import { UnauthorizedError, ValidationError } from "@/core/errors/app-error";
import {
  verifyEmployeePinIdentity,
  verifyOwnerPasswordIdentity,
} from "@/features/auth/server/auth-identities";
import { getRuntimeSettingsByOrganizationId } from "@/features/runtime-settings/server/runtime-settings-service";
import {
  collectStaffPersonNameCandidates,
  findStaffPerson,
  resolveEmployeeUserId,
} from "@/features/auth/server/resolve-employee-user-id";
import { resolveUserDisplayName } from "@/features/auth/server/resolve-user-display-name";

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

const BOOTSTRAP_OWNER_USERNAME = process.env.AUTH_OWNER_USERNAME || "hajri";
const BOOTSTRAP_OWNER_PASSWORD = process.env.AUTH_OWNER_PASSWORD || "";
const BOOTSTRAP_EMPLOYEE_PINS: Record<string, string> = {};

type StaffPerson = {
  id?: string;
  nameAr?: string;
  nameEn?: string;
};

function readRuntimeStaff(
  runtimeSettings: Record<string, unknown> | null | undefined,
): StaffPerson[] {
  return Array.isArray(runtimeSettings?.staff)
    ? runtimeSettings.staff.filter((entry): entry is StaffPerson => Boolean(entry && typeof entry === "object"))
    : [];
}

async function lookupOrganizationEmployeeUserIdByNames(
  organizationId: string,
  nameCandidates: string[],
): Promise<string> {
  const uniqueNames = [...new Set(nameCandidates.map((value) => normalize(value)).filter(Boolean))];
  if (!uniqueNames.length) return "";

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
        or(eq(organizationMembers.role, "employee"), eq(organizationMembers.role, "manager")),
        or(...uniqueNames.map((name) => ilike(users.name, name))),
      ),
    )
    .limit(1);

  return member?.userId && isUuid(member.userId) ? member.userId : "";
}

async function resolveEmployeeUserIdWithFallback(
  employeeId: string,
  userIdMap: Record<string, string>,
  runtimeSettings: Record<string, unknown> | null | undefined,
  organizationId: string,
): Promise<string> {
  const mapped = resolveEmployeeUserId(employeeId, userIdMap, runtimeSettings);
  if (mapped) return mapped;

  const normalized = normalize(employeeId);
  if (!normalized) return "";
  if (isUuid(normalized)) return normalized;

  const staff = readRuntimeStaff(runtimeSettings);
  const person = findStaffPerson(staff, normalized);
  const nameCandidates = collectStaffPersonNameCandidates(person, normalized);

  const fromOrganization = await lookupOrganizationEmployeeUserIdByNames(organizationId, nameCandidates);
  if (fromOrganization) return fromOrganization;

  if (isAuthDbCredentialsEnabled()) {
    return resolveEmployeeUserIdGlobal(nameCandidates);
  }

  return "";
}

async function resolveEmployeeUserIdGlobal(nameCandidates: string[]): Promise<string> {
  const uniqueNames = [...new Set(nameCandidates.map((value) => normalize(value)).filter(Boolean))];
  if (!uniqueNames.length) return "";

  const db = getDb();
  const [member] = await db
    .select({
      userId: organizationMembers.userId,
    })
    .from(organizationMembers)
    .innerJoin(users, eq(users.id, organizationMembers.userId))
    .where(
      and(
        eq(organizationMembers.status, "active"),
        or(eq(organizationMembers.role, "employee"), eq(organizationMembers.role, "manager")),
        or(...uniqueNames.map((name) => ilike(users.name, name))),
      ),
    )
    .limit(1);

  return member?.userId && isUuid(member.userId) ? member.userId : "";
}

async function isEmployeeLoginName(
  loginName: string,
  organizationId: string,
  runtimeSettings: Record<string, unknown> | null | undefined,
): Promise<boolean> {
  const normalized = normalize(loginName);
  if (!normalized || isUuid(normalized)) return false;

  const staff = readRuntimeStaff(runtimeSettings);
  if (findStaffPerson(staff, normalized)) return true;

  const userId = await lookupOrganizationEmployeeUserIdByNames(
    organizationId,
    collectStaffPersonNameCandidates(undefined, normalized),
  );
  return Boolean(userId);
}

type ActiveMember = {
  organizationId: string;
  userId: string;
  role: string;
  status: string;
};

async function resolveActiveMembership(
  userId: string,
  loginRole: "owner" | "employee",
): Promise<ActiveMember | null> {
  const db = getDb();
  const rows = await db
    .select({
      organizationId: organizationMembers.organizationId,
      userId: organizationMembers.userId,
      role: organizationMembers.role,
      status: organizationMembers.status,
    })
    .from(organizationMembers)
    .where(
      and(
        eq(organizationMembers.userId, userId),
        eq(organizationMembers.status, "active"),
      ),
    )
    .limit(20);

  if (!rows.length) return null;

  if (loginRole === "owner") {
    return rows.find((row) => row.role === "owner") ?? null;
  }

  return rows.find((row) => row.role === "employee" || row.role === "manager") ?? null;
}

function resolveMemberRole(memberRole: string, loginRole: "owner" | "employee"): "owner" | "manager" | "employee" {
  if (loginRole === "owner") return "owner";
  if (memberRole === "manager") return "manager";
  return "employee";
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
  const runtimeSettings = (runtimeSettingsEnvelope?.settings || null) as Record<string, unknown> | null;
  const parsedAuthConfig = authConfigSchema.safeParse(runtimeSettings?.authConfig || {});
  const runtimeAuthConfig = parsedAuthConfig.success ? parsedAuthConfig.data : {};

  // Server env wins over DB authConfig so ops can recover owner login via .env / secrets
  // without rewriting historical runtime settings rows.
  const ownerUsername =
    envAuth.ownerUsername
    || runtimeAuthConfig.ownerUsername
    || BOOTSTRAP_OWNER_USERNAME;
  const ownerPassword =
    envAuth.ownerPassword
    || runtimeAuthConfig.ownerPassword
    || BOOTSTRAP_OWNER_PASSWORD
    || "";
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
    if (!username || !password) {
      throw new ValidationError("username and password are required.");
    }

    if (isAuthDbCredentialsEnabled()) {
      const verified = await verifyOwnerPasswordIdentity(username, password);
      if (!verified) {
        if (await isEmployeeLoginName(username, organizationId, runtimeSettings)) {
          throw new UnauthorizedError("Employee accounts must use employee login.");
        }
        throw new UnauthorizedError("Invalid credentials.");
      }
      userId = verified.userId;
      role = "owner";
    } else {
      if (!ownerUsername || !ownerPassword) {
        throw new ValidationError("Owner auth configuration is incomplete.");
      }
      if (username !== ownerUsername.trim().toLowerCase() || password !== ownerPassword) {
        if (await isEmployeeLoginName(username, organizationId, runtimeSettings)) {
          throw new UnauthorizedError("Employee accounts must use employee login.");
        }
        throw new UnauthorizedError("Invalid credentials.");
      }
      userId = ownerUserId;
      role = "owner";
    }
  } else {
    const employeeId = normalize(input.employeeId);
    const pin = normalize(input.pin);
    if (!employeeId || !pin) {
      throw new ValidationError("employeeId and pin are required.");
    }
    let mappedUserId = await resolveEmployeeUserIdWithFallback(
      employeeId,
      userIdMap,
      runtimeSettings,
      organizationId,
    );
    if (!mappedUserId && isAuthDbCredentialsEnabled()) {
      const staff = readRuntimeStaff(runtimeSettings);
      const person = findStaffPerson(staff, employeeId);
      mappedUserId = await resolveEmployeeUserIdGlobal(
        collectStaffPersonNameCandidates(person, employeeId),
      );
    }
    if (!mappedUserId) {
      throw new UnauthorizedError("Employee account mapping is invalid.");
    }

    if (isAuthDbCredentialsEnabled()) {
      const verified = await verifyEmployeePinIdentity(mappedUserId, pin);
      if (!verified) {
        throw new UnauthorizedError("Invalid employee pin.");
      }
      userId = verified.userId;
      role = "employee";
    } else {
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
  }

  if (isAuthDbCredentialsEnabled()) {
    const member = await resolveActiveMembership(userId, role);
    if (!member) {
      throw new UnauthorizedError("User is not an active organization member.");
    }
    if (role === "owner" && member.role !== "owner") {
      throw new UnauthorizedError("Owner credentials are not linked to an owner member.");
    }

    const displayName = await resolveUserDisplayName(userId);

    return {
      organizationId: member.organizationId,
      userId,
      role: resolveMemberRole(member.role, role),
      displayName,
    };
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

  const displayName = await resolveUserDisplayName(userId);

  return {
    organizationId,
    userId,
    role: resolveMemberRole(member.role, role),
    displayName,
  };
}

