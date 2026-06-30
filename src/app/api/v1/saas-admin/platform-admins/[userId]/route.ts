import { readJsonBody } from "@/core/http/api-route-handler";
import { ValidationError } from "@/core/errors/app-error";
import {
  revokePlatformAdmin,
  updatePlatformAdminProfile,
  updatePlatformAdminRole,
} from "@/features/saas-admin/server/platform-admin-grants-repository";
import { parsePlatformAdminRole } from "@/features/saas-admin/server/platform-admin-roles";
import {
  requireSaasAdminRouteParam,
  withSaasAdminApiRoute,
} from "@/features/saas-admin/server/saas-admin-api-route";

export const dynamic = "force-dynamic";

type Body = {
  role?: string;
  name?: string;
  username?: string;
  password?: string;
};

export const PATCH = withSaasAdminApiRoute<{ userId: string }>(
  "platform-admins:write",
  async ({ actor, params, request }) => {
    const userId = requireSaasAdminRouteParam(params.userId, "userId");
    const body = await readJsonBody<Body>(request);
  const hasProfileUpdate = Boolean(body.name?.trim() && body.username?.trim());
  const nextRole = parsePlatformAdminRole(body.role);

  if (!nextRole && !hasProfileUpdate) {
    throw new ValidationError("At least one field must be provided to update.");
  }

  let admin;
  if (nextRole) {
    admin = await updatePlatformAdminRole(userId, { role: nextRole }, actor.actorUserId);
  }
  if (hasProfileUpdate) {
    admin = await updatePlatformAdminProfile(
      userId,
      {
        name: body.name!.trim(),
        username: body.username!.trim(),
        password: body.password?.trim() || undefined,
      },
      actor.actorUserId,
    );
  }

  if (!admin) {
    throw new ValidationError("At least one field must be provided to update.");
  }

    return { admin };
  },
);

export const DELETE = withSaasAdminApiRoute<{ userId: string }>("platform-admins:write", async ({
  actor,
  params,
}) => {
  const userId = requireSaasAdminRouteParam(params.userId, "userId");

  await revokePlatformAdmin(userId, actor.actorUserId);
  return { revoked: true, userId };
});
