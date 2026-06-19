import { fail, ok } from "@/core/http/api-response";
import { ValidationError } from "@/core/errors/app-error";
import {
  revokePlatformAdmin,
  updatePlatformAdminProfile,
  updatePlatformAdminRole,
} from "@/features/saas-admin/server/platform-admin-grants-repository";
import { parsePlatformAdminRole } from "@/features/saas-admin/server/platform-admin-roles";
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

    const body = await request.json() as {
      role?: string;
      name?: string;
      username?: string;
      password?: string;
    };

    const hasProfileUpdate = Boolean(body.name?.trim() && body.username?.trim());
    const nextRole = parsePlatformAdminRole(body.role);

    if (!nextRole && !hasProfileUpdate) {
      throw new ValidationError("At least one field must be provided to update.");
    }

    let admin;
    if (nextRole) {
      admin = await updatePlatformAdminRole(userId, { role: nextRole }, actorUserId);
    }
    if (hasProfileUpdate) {
      admin = await updatePlatformAdminProfile(
        userId,
        {
          name: body.name!.trim(),
          username: body.username!.trim(),
          password: body.password?.trim() || undefined,
        },
        actorUserId,
      );
    }

    if (!admin) {
      throw new ValidationError("At least one field must be provided to update.");
    }

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
