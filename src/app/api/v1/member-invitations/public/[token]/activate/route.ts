import { buildSetAuthSessionCookieHeader } from "@/core/auth/session-cookie";
import { readJsonBody, withApiRoute } from "@/core/http/api-route-handler";
import { ServiceUnavailableError } from "@/core/errors/app-error";
import { readEnv } from "@/core/config/env";
import { activateMemberInvitation } from "@/features/member-invitations/server/activate-member-invitation";
import { buildSetTrustedDeviceCookieHeader } from "@/features/trusted-devices/server/trusted-device-cookie";

export const dynamic = "force-dynamic";

type Body = Record<string, unknown>;

export const POST = withApiRoute<{ token: string }>(async ({ params, request }) => {
  const env = readEnv();
  if (!env.AUTH_SESSION_SECRET || env.AUTH_SESSION_SECRET.length < 16) {
    throw new ServiceUnavailableError("AUTH_SESSION_SECRET is not configured.");
  }

  const body = await readJsonBody<Body>(request);

  const activated = await activateMemberInvitation({
    token: params.token,
    phone: typeof body?.phone === "string" ? body.phone : "",
    pin: typeof body?.pin === "string" ? body.pin : "",
    trustDevice: body?.trustDevice !== false,
  });

  const secureCookie = env.NODE_ENV === "production" || env.APP_MODE === "production";
  const headers = new Headers({ "content-type": "application/json" });
  headers.append(
    "set-cookie",
    buildSetAuthSessionCookieHeader(
      {
        organizationId: activated.organizationId,
        userId: activated.userId,
        role: activated.role,
        ttlSeconds: 60 * 60 * 12,
      },
      env.AUTH_SESSION_COOKIE_NAME,
      env.AUTH_SESSION_SECRET,
      { secure: secureCookie },
    ),
  );

  if (activated.trustedDevice) {
    headers.append(
      "set-cookie",
      buildSetTrustedDeviceCookieHeader(
        {
          userId: activated.userId,
          deviceId: activated.trustedDevice.deviceId,
          secret: activated.trustedDevice.secret,
        },
        { secure: secureCookie },
      ),
    );
  }

  return new Response(
    JSON.stringify({
      organizationId: activated.organizationId,
      userId: activated.userId,
      role: activated.role,
      storeId: activated.storeId,
      displayName: activated.displayName,
    }),
    { status: 200, headers },
  );
});
