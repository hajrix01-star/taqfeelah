import { fail, ok } from "@/core/http/api-response";
import { ValidationError } from "@/core/errors/app-error";
import {
  revokePlatformAdmin,
  updatePlatformAdminRole,
} from "@/features/saas-admin/server/platform-admin-grants-repository";
import { assertSaasAdminRouteReady } from "@/features/saas-admin/server/saas-admin-route-guard";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ userId: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { actorUserId } = await assertSaasAdminRouteReady(request, "platform-admins:write");
    const { userId } = await context.params;
    if (!userId) {
      throw new ValidationError("userId is required.");
    }

    const body = await request.json() as { role?: string };
    const admin = await updatePlatformAdminRole(
      userId,
      { role: body.role === "owner" ? "owner" : "support" },
      actorUserId,
    );
    return ok({ admin });
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const { actorUserId } = await assertSaasAdminRouteReady(request, "platform-admins:write");
    const { userId } = await context.params;
    if (!userId) {
      throw new ValidationError("userId is required.");
    }

    await revokePlatformAdmin(userId, actorUserId);
    return ok({ revoked: true, userId });
  } catch (error) {
    return fail(error);
  }
}
