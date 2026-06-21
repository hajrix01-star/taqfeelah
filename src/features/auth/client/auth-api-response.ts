import type { AuthServerSession, AuthStaffMember } from "./auth-client-types";

export function readAuthApiRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

export function readAuthServerSession(value: unknown): AuthServerSession {
  const record = readAuthApiRecord(value);
  return {
    authenticated: record.authenticated === true,
    role: typeof record.role === "string" ? record.role : undefined,
    userId: typeof record.userId === "string" ? record.userId : undefined,
    organizationId: typeof record.organizationId === "string" ? record.organizationId : undefined,
    displayName: typeof record.displayName === "string" ? record.displayName : undefined,
    mustChangePassword: record.mustChangePassword === true,
  };
}

export function readPasswordResetRequestMessage(value: unknown): string | undefined {
  const message = readAuthApiRecord(value).message;
  return typeof message === "string" ? message : undefined;
}

export function readPasswordResetTokenValid(value: unknown): boolean {
  return readAuthApiRecord(value).valid === true;
}

export function readEmployeeLoginRosterPayload(value: unknown): { staff?: AuthStaffMember[] } {
  const record = readAuthApiRecord(value);
  return {
    staff: Array.isArray(record.staff) ? record.staff as AuthStaffMember[] : undefined,
  };
}
