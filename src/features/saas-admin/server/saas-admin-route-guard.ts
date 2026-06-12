import { assertPlatformAdminAccess } from "@/core/auth/assert-platform-admin-access";
import type { MemberRole } from "@/core/auth/roles";
import { isSaasAdminApiEnabled } from "@/core/config/saas-admin-api-mode";
import { readEnv } from "@/core/config/env";
import { resolveRequestContext } from "@/core/auth/request-context";
import { ServiceUnavailableError } from "@/core/errors/app-error";
import { resolvePlatformAdminRole } from "@/features/saas-admin/server/platform-admin-grants-repository";
import {
  assertPlatformAdminPermissionRole,
  type PlatformAdminPermission,
  type PlatformAdminRole,
} from "@/features/saas-admin/server/platform-admin-roles";

export type SaasAdminRouteActor = {
  actorUserId: string;
  role: MemberRole | null;
  platformAdminRole: PlatformAdminRole;
};

export async function assertSaasAdminRouteReady(
  request: Request,
  permission?: PlatformAdminPermission,
): Promise<SaasAdminRouteActor> {
  if (!isSaasAdminApiEnabled()) {
    throw new ServiceUnavailableError("SaaS admin API is disabled.");
  }

  const env = readEnv();
  if (!env.DATABASE_URL) {
    throw new ServiceUnavailableError("DATABASE_URL is not configured.");
  }

  const requestContext = resolveRequestContext(request, { requireUser: true });
  const actorUserId = requestContext.userId!;
  const role = requestContext.role;
  await assertPlatformAdminAccess({
    actorUserId,
    role: role ?? undefined,
  });

  const platformAdminRole = await resolvePlatformAdminRole(actorUserId);
  if (!platformAdminRole) {
    throw new ServiceUnavailableError("Platform admin role is not configured.");
  }

  if (permission) {
    assertPlatformAdminPermissionRole(platformAdminRole, permission);
  }

  return { actorUserId, role, platformAdminRole };
}
