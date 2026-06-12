import { assertPlatformAdminAccess } from "@/core/auth/assert-platform-admin-access";
import type { MemberRole } from "@/core/auth/roles";
import { isSaasAdminApiEnabled } from "@/core/config/saas-admin-api-mode";
import { readEnv } from "@/core/config/env";
import { resolveRequestContext } from "@/core/auth/request-context";
import { ServiceUnavailableError } from "@/core/errors/app-error";

export type SaasAdminRouteActor = {
  actorUserId: string;
  role: MemberRole | null;
};

export function assertSaasAdminRouteReady(request: Request): SaasAdminRouteActor {
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
  assertPlatformAdminAccess({
    actorUserId,
    role: role ?? undefined,
  });
  return { actorUserId, role };
}
