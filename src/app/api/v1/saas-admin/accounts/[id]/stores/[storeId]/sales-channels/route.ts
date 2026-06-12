import { fail, ok } from "@/core/http/api-response";
import { ValidationError } from "@/core/errors/app-error";
import { createSaasAccountStoreSalesChannel } from "@/features/saas-admin/server/create-saas-account-store-sales-channel";
import { listSaasAccountStoreSalesChannels } from "@/features/saas-admin/server/list-saas-account-store-sales-channels";
import { updateSaasAccountStoreSalesChannel } from "@/features/saas-admin/server/update-saas-account-store-sales-channel";
import { assertSaasAdminRouteReady } from "@/features/saas-admin/server/saas-admin-route-guard";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string; storeId: string }>;
};

function parseStatusFilter(value: string | null): "active" | "retired" | "all" {
  if (value === "active" || value === "retired" || value === "all") {
    return value;
  }
  return "all";
}

export async function GET(request: Request, context: RouteContext) {
  try {
    await assertSaasAdminRouteReady(request, "accounts:channels:write");
    const { id, storeId } = await context.params;
    if (!id?.trim() || !storeId?.trim()) {
      throw new ValidationError("Organization id and store id are required.");
    }

    const url = new URL(request.url);
    const result = await listSaasAccountStoreSalesChannels({
      organizationId: id.trim(),
      storeId: storeId.trim(),
      status: parseStatusFilter(url.searchParams.get("status")),
    });

    return ok(result);
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { actorUserId } = await assertSaasAdminRouteReady(request, "accounts:channels:write");
    const { id, storeId } = await context.params;
    if (!id?.trim() || !storeId?.trim()) {
      throw new ValidationError("Organization id and store id are required.");
    }

    const body = await request.json();
    const created = await createSaasAccountStoreSalesChannel({
      actorUserId,
      organizationId: id.trim(),
      storeId: storeId.trim(),
      name: typeof body?.name === "string" ? body.name : "",
      status: body?.status === "retired" ? "retired" : "active",
      reason: typeof body?.reason === "string" ? body.reason : undefined,
    });

    return ok({ channel: created }, { status: 201 });
  } catch (error) {
    return fail(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { actorUserId } = await assertSaasAdminRouteReady(request, "accounts:channels:write");
    const { id, storeId } = await context.params;
    if (!id?.trim() || !storeId?.trim()) {
      throw new ValidationError("Organization id and store id are required.");
    }

    const body = await request.json();
    if (typeof body?.salesChannelId !== "string" || !body.salesChannelId.trim()) {
      throw new ValidationError("salesChannelId is required.");
    }
    if (body?.status !== "active" && body?.status !== "retired") {
      throw new ValidationError("status must be active or retired.");
    }

    const updated = await updateSaasAccountStoreSalesChannel({
      actorUserId,
      organizationId: id.trim(),
      storeId: storeId.trim(),
      salesChannelId: body.salesChannelId.trim(),
      status: body.status,
      reason: typeof body?.reason === "string" ? body.reason : undefined,
    });

    return ok(updated);
  } catch (error) {
    return fail(error);
  }
}
