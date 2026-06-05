import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/core/db/client";
import { organizationMembers } from "@/core/db/schema";
import { getProductionAuthRuntimeConfig } from "@/core/config/env";
import { UnauthorizedError, ValidationError } from "@/core/errors/app-error";

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

function mapEmployeeUserId(employeeId: string, userIdMap: Record<string, string>): string {
  if (isUuid(employeeId)) return employeeId;
  const mapped = userIdMap[employeeId] || userIdMap[employeeId.trim()];
  return typeof mapped === "string" && isUuid(mapped) ? mapped : "";
}

export async function createAuthSession(rawInput: LoginInput) {
  const parsed = loginInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ValidationError("Invalid login payload.", parsed.error.flatten());
  }
  const input = parsed.data;
  const runtimeAuth = getProductionAuthRuntimeConfig();
  if (!runtimeAuth.organizationId) {
    throw new ValidationError("Auth organization ID is not configured.");
  }

  let userId = "";
  let role: "owner" | "employee" = "employee";

  if (input.mode === "owner_password") {
    const username = normalize(input.username).toLowerCase();
    const password = normalize(input.password);
    if (!runtimeAuth.ownerUsername || !runtimeAuth.ownerPassword || !runtimeAuth.ownerUserId) {
      throw new ValidationError("Owner auth configuration is incomplete.");
    }
    if (
      username !== runtimeAuth.ownerUsername.trim().toLowerCase()
      || password !== runtimeAuth.ownerPassword
    ) {
      throw new UnauthorizedError("Invalid credentials.");
    }
    userId = runtimeAuth.ownerUserId;
    role = "owner";
  } else {
    const employeeId = normalize(input.employeeId);
    const pin = normalize(input.pin);
    if (!employeeId || !pin) {
      throw new ValidationError("employeeId and pin are required.");
    }
    const mappedUserId = mapEmployeeUserId(employeeId, runtimeAuth.userIdMap);
    if (!mappedUserId) {
      throw new UnauthorizedError("Employee account mapping is invalid.");
    }
    const expectedPin = runtimeAuth.employeePinMap[employeeId] || runtimeAuth.employeePinMap[mappedUserId];
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
        eq(organizationMembers.organizationId, runtimeAuth.organizationId),
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
    organizationId: runtimeAuth.organizationId,
    userId,
    role: role === "owner" ? "owner" : resolvedMemberRole,
  };
}
