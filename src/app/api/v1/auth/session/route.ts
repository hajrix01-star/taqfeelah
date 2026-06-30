import { readEnv, assertProductionRuntimeEnv, isServerProductionMode, isAuthSessionCookieSecure } from "@/core/config/env";
import {
  buildClearAuthSessionCookieHeader,
  buildSetAuthSessionCookieHeader,
  resolveAuthSessionFromRequest,
} from "@/core/auth/session-cookie";
import { createAuthSession } from "@/features/auth/server/create-auth-session";
import { getOwnerPasswordIdentityFlags } from "@/features/auth/server/auth-identities";
import { resolveUserDisplayName } from "@/features/auth/server/resolve-user-display-name";
import { ServiceUnavailableError, UnauthorizedError } from "@/core/errors/app-error";
import { readJsonBody, withApiRouteNoParams, withPublicApiRouteNoParams } from "@/core/http/api-route-handler";
import { fireUsageEventSafe } from "@/features/usage/server/fire-usage-event-safe";
import { runRateLimitedAuthRequest } from "@/features/auth/server/rate-limited-auth-request";
import {
  TRUSTED_DEVICE_COOKIE_NAME,
  buildSetTrustedDeviceCookieHeader,
} from "@/features/trusted-devices/server/trusted-device-cookie";

export const dynamic = "force-dynamic";

function resolveLoginIdentifier(payload: Record<string, unknown>): string {
  if (payload.mode === "platform_admin_password") {
    return typeof payload.email === "string"
      ? payload.email
      : (typeof payload.username === "string" ? payload.username : "");
  }
  if (payload.mode === "employee_pin" || payload.mode === "employee_phone_pin") {
    return typeof payload.phone === "string"
      ? payload.phone
      : (typeof payload.employeeId === "string" ? payload.employeeId : "");
  }
  return typeof payload.phone === "string"
    ? payload.phone
    : (typeof payload.username === "string" ? payload.username : "");
}

function readCookieValue(request: Request, name: string): string | undefined {
  const header = request.headers.get("cookie");
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const [rawKey, ...rest] = part.trim().split("=");
    if (rawKey === name) return rest.join("=");
  }
  return undefined;
}

export const GET = withPublicApiRouteNoParams(async ({ request }) => {
  const env = readEnv();
  if (isServerProductionMode(env)) {
    assertProductionRuntimeEnv(env);
  }
  const session = resolveAuthSessionFromRequest(
    request,
    env.AUTH_SESSION_COOKIE_NAME,
    env.AUTH_SESSION_SECRET,
  );
  if (!session) {
    return { authenticated: false };
  }
  const displayName = await resolveUserDisplayName(session.userId);
  const ownerFlags = session.role === "owner"
    ? await getOwnerPasswordIdentityFlags(session.userId)
    : null;
  return {
    authenticated: true,
    organizationId: session.organizationId,
    userId: session.userId,
    role: session.role,
    displayName,
    mustChangePassword: ownerFlags?.mustChangePassword === true,
  };
});

export const POST = withApiRouteNoParams(async ({ request }) => {
  const env = readEnv();
  const payload = await readJsonBody<Record<string, unknown>>(request);
  const sessionClaims = await runRateLimitedAuthRequest({
    request,
    key: resolveLoginIdentifier(payload),
    rateLimitedMessage: "Too many login attempts. Try again later.",
    clearOnSuccess: true,
    recordFailureFor: (error) => error instanceof UnauthorizedError,
    action: () => createAuthSession({
      ...(payload as Parameters<typeof createAuthSession>[0]),
      trustedDeviceCookie: readCookieValue(request, TRUSTED_DEVICE_COOKIE_NAME),
    }),
  });

  if (!env.AUTH_SESSION_SECRET || env.AUTH_SESSION_SECRET.length < 16) {
    throw new ServiceUnavailableError("AUTH_SESSION_SECRET is not configured.");
  }

  const secureCookie = isAuthSessionCookieSecure(env);
  const setCookie = buildSetAuthSessionCookieHeader(
    {
      organizationId: sessionClaims.organizationId,
      userId: sessionClaims.userId,
      role: sessionClaims.role,
      ttlSeconds: 60 * 60 * 12,
    },
    env.AUTH_SESSION_COOKIE_NAME,
    env.AUTH_SESSION_SECRET,
    { secure: secureCookie },
  );

  const eventDate = new Date().toISOString().slice(0, 10);
  void fireUsageEventSafe({
    organizationId: sessionClaims.organizationId,
    userId: sessionClaims.userId,
    eventName: "login_success",
    eventDate,
    metadata: { role: sessionClaims.role },
  });

  const headers = new Headers({ "content-type": "application/json" });
  headers.append("set-cookie", setCookie);

  if ("trustedDevice" in sessionClaims && sessionClaims.trustedDevice) {
    headers.append(
      "set-cookie",
      buildSetTrustedDeviceCookieHeader(
        {
          userId: sessionClaims.userId,
          deviceId: sessionClaims.trustedDevice.deviceId,
          secret: sessionClaims.trustedDevice.secret,
        },
        { secure: secureCookie },
      ),
    );
  }

  return new Response(
    JSON.stringify({
      organizationId: sessionClaims.organizationId,
      userId: sessionClaims.userId,
      role: sessionClaims.role,
      displayName: sessionClaims.displayName || "",
      mustChangePassword: sessionClaims.mustChangePassword === true,
    }),
    { status: 200, headers },
  );
});

export const DELETE = withPublicApiRouteNoParams(() => {
  const env = readEnv();
  const secureCookie = isAuthSessionCookieSecure(env);
  return {
    data: { success: true },
    init: {
      headers: {
        "set-cookie": buildClearAuthSessionCookieHeader(env.AUTH_SESSION_COOKIE_NAME, secureCookie),
      },
    },
  };
});
