import {
  type ApiRouteContext,
  type ApiRouteResult,
  withApiRoute,
  withApiRouteNoParams,
} from "@/core/http/api-route-handler";
import { ValidationError } from "@/core/errors/app-error";
import {
  assertSaasAdminRouteReady,
  type SaasAdminRouteActor,
} from "@/features/saas-admin/server/saas-admin-route-guard";
import type { PlatformAdminPermission } from "@/features/saas-admin/server/platform-admin-roles";

type SaasAdminRouteContext<TParams = Record<string, string>> = ApiRouteContext<TParams> & {
  actor: SaasAdminRouteActor;
};

type SaasAdminRouteHandler<TParams extends Record<string, string>, TResult> = (
  context: SaasAdminRouteContext<TParams>,
) => Promise<ApiRouteResult<TResult>> | ApiRouteResult<TResult>;

export function withSaasAdminApiRoute<
  TParams extends Record<string, string> = Record<string, string>,
  TResult = unknown,
>(
  permission: PlatformAdminPermission,
  handler: SaasAdminRouteHandler<TParams, TResult>,
) {
  return withApiRoute<TParams, TResult>(async (context) => {
    const actor = await assertSaasAdminRouteReady(context.request, permission);
    return handler({ ...context, actor });
  });
}

export function withSaasAdminApiRouteNoParams<TResult = unknown>(
  permission: PlatformAdminPermission,
  handler: SaasAdminRouteHandler<Record<string, string>, TResult>,
) {
  return withApiRouteNoParams<TResult>(async (context) => {
    const actor = await assertSaasAdminRouteReady(context.request, permission);
    return handler({ ...context, actor });
  });
}

export function requireSaasAdminRouteParam(value: string | undefined, label: string): string {
  const trimmed = value?.trim();
  if (!trimmed) {
    throw new ValidationError(`${label} is required.`);
  }
  return trimmed;
}
