import { readJsonBody } from "@/core/http/api-route-handler";
import { ValidationError } from "@/core/errors/app-error";
import { createSaasAccountStoreSalesChannel } from "@/features/saas-admin/server/create-saas-account-store-sales-channel";
import { listSaasAccountStoreSalesChannels } from "@/features/saas-admin/server/list-saas-account-store-sales-channels";
import { updateSaasAccountStoreSalesChannel } from "@/features/saas-admin/server/update-saas-account-store-sales-channel";
import {
  requireSaasAdminRouteParam,
  withSaasAdminApiRoute,
} from "@/features/saas-admin/server/saas-admin-api-route";

export const dynamic = "force-dynamic";

type Body = Record<string, unknown>;

function parseStatusFilter(value: string | null): "active" | "retired" | "all" {
  if (value === "active" || value === "retired" || value === "all") {
    return value;
  }
  return "all";
}

export const GET = withSaasAdminApiRoute<{ id: string; storeId: string }>(
  "accounts:channels:write",
  ({ params, searchParams }) =>
    listSaasAccountStoreSalesChannels({
      organizationId: requireSaasAdminRouteParam(params.id, "Organization id"),
      storeId: requireSaasAdminRouteParam(params.storeId, "Store id"),
      status: parseStatusFilter(searchParams.get("status")),
    }),
);

export const POST = withSaasAdminApiRoute<{ id: string; storeId: string }>(
  "accounts:channels:write",
  async ({ actor, params, request }) => {
    const organizationId = requireSaasAdminRouteParam(params.id, "Organization id");
    const storeId = requireSaasAdminRouteParam(params.storeId, "Store id");
    const body = await readJsonBody<Body>(request);

    const created = await createSaasAccountStoreSalesChannel({
      actorUserId: actor.actorUserId,
      organizationId,
      storeId,
      name: typeof body?.name === "string" ? body.name : "",
      status: body?.status === "retired" ? "retired" : "active",
      reason: typeof body?.reason === "string" ? body.reason : undefined,
    });

    return { data: { channel: created }, init: { status: 201 } };
  },
);

export const PATCH = withSaasAdminApiRoute<{ id: string; storeId: string }>(
  "accounts:channels:write",
  async ({ actor, params, request }) => {
    const organizationId = requireSaasAdminRouteParam(params.id, "Organization id");
    const storeId = requireSaasAdminRouteParam(params.storeId, "Store id");
    const body = await readJsonBody<Body>(request);
    if (typeof body?.salesChannelId !== "string" || !body.salesChannelId.trim()) {
      throw new ValidationError("salesChannelId is required.");
    }
    if (body?.status !== "active" && body?.status !== "retired") {
      throw new ValidationError("status must be active or retired.");
    }

    return updateSaasAccountStoreSalesChannel({
      actorUserId: actor.actorUserId,
      organizationId,
      storeId,
      salesChannelId: body.salesChannelId.trim(),
      status: body.status,
      reason: typeof body?.reason === "string" ? body.reason : undefined,
    });
  },
);
