import { fail, ok } from "@/core/http/api-response";
import { ServiceUnavailableError, ValidationError } from "@/core/errors/app-error";
import { readEnv } from "@/core/config/env";
import { resolveRequestContext } from "@/core/auth/request-context";
import { listStoreSalesChannels } from "@/features/org-config/server/list-store-sales-channels";
import { createStoreSalesChannel } from "@/features/org-config/server/create-store-sales-channel";
import { updateStoreSalesChannel } from "@/features/org-config/server/update-store-sales-channel";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ storeId: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  try {
    const env = readEnv();
    if (!env.DATABASE_URL) {
      throw new ServiceUnavailableError("DATABASE_URL is not configured.");
    }

    const params = await context.params;
    const requestContext = resolveRequestContext(request, { requireUser: true });
    const { searchParams } = new URL(request.url);
    const statusRaw = searchParams.get("status") || "all";
    if (statusRaw !== "active" && statusRaw !== "retired" && statusRaw !== "all") {
      throw new ValidationError("Query param 'status' must be one of: active, retired, all.");
    }

    const result = await listStoreSalesChannels({
      organizationId: requestContext.organizationId,
      storeId: params.storeId,
      actorUserId: requestContext.userId!,
      actorRole: requestContext.role!,
      status: statusRaw,
    });

    return ok(result);
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const env = readEnv();
    if (!env.DATABASE_URL) {
      throw new ServiceUnavailableError("DATABASE_URL is not configured.");
    }

    const params = await context.params;
    const requestContext = resolveRequestContext(request, { requireUser: true });
    const body = await request.json();
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
      organizationId: requestContext.organizationId,
      storeId: params.storeId,
      actorUserId: requestContext.userId!,
      actorRole: requestContext.role!,
      name,
      kind: body?.kind === "sales_channel" ? "sales_channel" : "payment_method",
      status: body?.status === "retired" ? "retired" : "active",
      reason: typeof body?.reason === "string" ? body.reason : undefined,
    });

    return ok({ channel: created });
  } catch (error) {
    return fail(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const env = readEnv();
    if (!env.DATABASE_URL) {
      throw new ServiceUnavailableError("DATABASE_URL is not configured.");
    }

    const params = await context.params;
    const requestContext = resolveRequestContext(request, { requireUser: true });
    const body = await request.json();
    if (body?.status !== "active" && body?.status !== "retired") {
      throw new ValidationError("Body field 'status' must be 'active' or 'retired'.");
    }

    const updated = await updateStoreSalesChannel({
      organizationId: requestContext.organizationId,
      storeId: params.storeId,
      actorUserId: requestContext.userId!,
      actorRole: requestContext.role!,
      salesChannelId: typeof body?.salesChannelId === "string" ? body.salesChannelId : "",
      status: body.status,
      reason: typeof body?.reason === "string" ? body.reason : undefined,
    });

    return ok(updated);
  } catch (error) {
    return fail(error);
  }
}
