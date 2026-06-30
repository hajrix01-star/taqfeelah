import { ValidationError } from "@/core/errors/app-error";
import { parseEnumQuery, readJsonBody, withAuthedApiRoute } from "@/core/http/api-route-handler";
import { listStoreSalesChannels } from "@/features/org-config/server/list-store-sales-channels";
import { createStoreSalesChannel } from "@/features/org-config/server/create-store-sales-channel";
import { updateStoreSalesChannel } from "@/features/org-config/server/update-store-sales-channel";

export const dynamic = "force-dynamic";

export const GET = withAuthedApiRoute<{ storeId: string }>(async ({ auth, params, searchParams }) => {
  const statusRaw = parseEnumQuery(searchParams, "status", ["active", "retired", "all"], "all");

  return listStoreSalesChannels({
    organizationId: auth.organizationId,
    storeId: params.storeId,
    actorUserId: auth.userId,
    actorRole: auth.role,
    status: statusRaw,
  });
});

export const POST = withAuthedApiRoute<{ storeId: string }>(async ({ auth, params, request }) => {
  const body = await readJsonBody<Record<string, unknown>>(request);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (!name) {
    throw new ValidationError("Body field 'name' is required.");
  }
  if (body?.status !== undefined && body.status !== "active" && body.status !== "retired") {
    throw new ValidationError("Body field 'status' must be 'active' or 'retired'.");
  }
  if (
    body?.kind !== undefined
    && body.kind !== "payment_method"
    && body.kind !== "sales_channel"
  ) {
    throw new ValidationError("Body field 'kind' must be 'payment_method' or 'sales_channel'.");
  }

  const created = await createStoreSalesChannel({
    organizationId: auth.organizationId,
    storeId: params.storeId,
    actorUserId: auth.userId,
    actorRole: auth.role,
    name,
    kind: body?.kind === "sales_channel" ? "sales_channel" : "payment_method",
    status: body?.status === "retired" ? "retired" : "active",
    reason: typeof body?.reason === "string" ? body.reason : undefined,
  });

  return { channel: created };
});

export const PATCH = withAuthedApiRoute<{ storeId: string }>(async ({ auth, params, request }) => {
  const body = await readJsonBody<Record<string, unknown>>(request);
  if (body?.status !== "active" && body?.status !== "retired") {
    throw new ValidationError("Body field 'status' must be 'active' or 'retired'.");
  }

  return updateStoreSalesChannel({
    organizationId: auth.organizationId,
    storeId: params.storeId,
    actorUserId: auth.userId,
    actorRole: auth.role,
    salesChannelId: typeof body?.salesChannelId === "string" ? body.salesChannelId : "",
    status: body.status,
    deleted: body?.deleted === true,
    reason: typeof body?.reason === "string" ? body.reason : undefined,
  });
});
