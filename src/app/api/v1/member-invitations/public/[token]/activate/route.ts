import { fail, ok } from "@/core/http/api-response";
import { buildSetAuthSessionCookieHeader } from "@/core/auth/session-cookie";
import { ServiceUnavailableError } from "@/core/errors/app-error";
import { readEnv } from "@/core/config/env";
import { activateMemberInvitation } from "@/features/member-invitations/server/activate-member-invitation";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ token: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const env = readEnv();
    if (!env.DATABASE_URL) {
      throw new ServiceUnavailableError("DATABASE_URL is not configured.");
    }
    if (!env.AUTH_SESSION_SECRET || env.AUTH_SESSION_SECRET.length < 16) {
      throw new ServiceUnavailableError("AUTH_SESSION_SECRET is not configured.");
    }

    const { token } = await context.params;
    const body = await request.json();

    const activated = await activateMemberInvitation({
      token,
      activationCode: typeof body?.activationCode === "string" ? body.activationCode : "",
      pin: typeof body?.pin === "string" ? body.pin : "",
      confirmPin: typeof body?.confirmPin === "string" ? body.confirmPin : "",
    });

    const secureCookie = env.NODE_ENV === "production" || env.APP_MODE === "production";
    const setCookie = buildSetAuthSessionCookieHeader(
      {
        organizationId: activated.organizationId,
        userId: activated.userId,
        role: activated.role,
        ttlSeconds: 60 * 60 * 12,
      },
      env.AUTH_SESSION_COOKIE_NAME,
      env.AUTH_SESSION_SECRET,
      { secure: secureCookie },
    );

    return ok(
      {
        organizationId: activated.organizationId,
        userId: activated.userId,
        role: activated.role,
        storeId: activated.storeId,
        displayName: activated.displayName,
      },
      {
        headers: {
          "set-cookie": setCookie,
        },
      },
    );
  } catch (error) {
    return fail(error);
  }
}
