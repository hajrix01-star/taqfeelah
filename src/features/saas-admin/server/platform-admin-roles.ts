import { z } from "zod";
import { ForbiddenError } from "@/core/errors/app-error";

export const PLATFORM_ADMIN_ROLES = ["owner", "support"] as const;

export type PlatformAdminRole = (typeof PLATFORM_ADMIN_ROLES)[number];

export const PLATFORM_ADMIN_PERMISSIONS = [
  "overview:read",
  "accounts:read",
  "accounts:write",
  "accounts:members:write",
  "accounts:setup-link",
  "accounts:repair",
  "accounts:channels:write",
  "plans:read",
  "plans:write",
  "usage:read",
  "investor-metrics:read",
  "system-health:read",
  "system-health:write",
  "platform-admins:read",
  "platform-admins:write",
  "analytics:aggregate",
] as const;

export type PlatformAdminPermission = (typeof PLATFORM_ADMIN_PERMISSIONS)[number];

const rolePermissionMatrix: Record<PlatformAdminRole, ReadonlySet<PlatformAdminPermission>> = {
  owner: new Set(PLATFORM_ADMIN_PERMISSIONS),
  support: new Set([
    "overview:read",
    "accounts:read",
    "accounts:setup-link",
    "accounts:repair",
    "accounts:channels:write",
    "usage:read",
    "system-health:read",
  ]),
};

const platformAdminRoleSchema = z.enum(PLATFORM_ADMIN_ROLES);

export function parsePlatformAdminRole(value: string | null | undefined): PlatformAdminRole | null {
  const parsed = platformAdminRoleSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export function platformAdminCan(
  role: PlatformAdminRole,
  permission: PlatformAdminPermission,
): boolean {
  return rolePermissionMatrix[role].has(permission);
}

export function assertPlatformAdminPermissionRole(
  role: PlatformAdminRole,
  permission: PlatformAdminPermission,
): void {
  if (!platformAdminCan(role, permission)) {
    throw new ForbiddenError("You do not have permission for this platform admin action.");
  }
}

export const PLATFORM_ADMIN_NAV_PERMISSIONS = {
  overview: "overview:read",
  accounts: "accounts:read",
  plans: "plans:read",
  platformAdmins: "platform-admins:read",
  usage: "usage:read",
  investorMetrics: "investor-metrics:read",
  systemHealth: "system-health:read",
} as const satisfies Record<string, PlatformAdminPermission>;
