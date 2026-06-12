import { fail, ok } from "@/core/http/api-response";
import { ValidationError } from "@/core/errors/app-error";
import {
  createPlatformAdminUser,
  grantPlatformAdmin,
  listPlatformAdmins,
  lookupPlatformAdminCandidate,
} from "@/features/saas-admin/server/platform-admin-grants-repository";
import { assertSaasAdminRouteReady } from "@/features/saas-admin/server/saas-admin-route-guard";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { actorUserId } = await assertSaasAdminRouteReady(request);
    const admins = await listPlatformAdmins(actorUserId);
    return ok({ admins });
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request) {
  try {
    const { actorUserId } = await assertSaasAdminRouteReady(request);
    const body = await request.json() as {
      action?: string;
      userId?: string;
      username?: string;
      name?: string;
      password?: string;
    };

    const action = typeof body?.action === "string" ? body.action.trim() : "";
    if (action === "lookup") {
      const result = await lookupPlatformAdminCandidate({
        username: typeof body.username === "string" ? body.username : undefined,
        userId: typeof body.userId === "string" ? body.userId : undefined,
      });
      return ok({ candidate: result });
    }

    if (action === "grant") {
      if (typeof body.userId !== "string") {
        throw new ValidationError("userId is required for grant.");
      }
      const admin = await grantPlatformAdmin({ userId: body.userId }, actorUserId);
      return ok({ admin });
    }

    if (action === "create") {
      const admin = await createPlatformAdminUser(
        {
          name: typeof body.name === "string" ? body.name : "",
          username: typeof body.username === "string" ? body.username : "",
          password: typeof body.password === "string" ? body.password : "",
        },
        actorUserId,
      );
      return ok({ admin });
    }

    throw new ValidationError("action must be lookup, grant, or create.");
  } catch (error) {
    return fail(error);
  }
}
