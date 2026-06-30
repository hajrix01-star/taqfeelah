import { readJsonBody } from "@/core/http/api-route-handler";
import { ValidationError } from "@/core/errors/app-error";
import {
  createPlatformAdminUser,
  grantPlatformAdmin,
  listPlatformAdmins,
  lookupPlatformAdminCandidate,
} from "@/features/saas-admin/server/platform-admin-grants-repository";
import { withSaasAdminApiRouteNoParams } from "@/features/saas-admin/server/saas-admin-api-route";

export const dynamic = "force-dynamic";

type Body = {
  action?: string;
  userId?: string;
  username?: string;
  name?: string;
  password?: string;
  role?: "owner" | "support";
};

export const GET = withSaasAdminApiRouteNoParams("platform-admins:read", async ({ actor }) => {
  const admins = await listPlatformAdmins(actor.actorUserId);
  return { admins };
});

export const POST = withSaasAdminApiRouteNoParams("platform-admins:write", async ({ actor, request }) => {
  const body = await readJsonBody<Body>(request);
  const action = typeof body?.action === "string" ? body.action.trim() : "";
  if (action === "lookup") {
    const result = await lookupPlatformAdminCandidate({
      username: typeof body.username === "string" ? body.username : undefined,
      userId: typeof body.userId === "string" ? body.userId : undefined,
    });
    return { candidate: result };
  }

  if (action === "grant") {
    if (typeof body.userId !== "string") {
      throw new ValidationError("userId is required for grant.");
    }
    const admin = await grantPlatformAdmin({
      userId: body.userId,
      role: body.role === "owner" ? "owner" : "support",
    }, actor.actorUserId);
    return { admin };
  }

  if (action === "create") {
    const admin = await createPlatformAdminUser(
      {
        name: typeof body.name === "string" ? body.name : "",
        username: typeof body.username === "string" ? body.username : "",
        password: typeof body.password === "string" ? body.password : "",
        role: body.role === "owner" ? "owner" : "support",
      },
      actor.actorUserId,
    );
    return { admin };
  }

  throw new ValidationError("action must be lookup, grant, or create.");
});
