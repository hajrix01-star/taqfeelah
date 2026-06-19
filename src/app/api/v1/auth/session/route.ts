import { failRequest, ok } from "@/core/http/api-response";
import { readEnv, assertProductionRuntimeEnv, isServerProductionMode } from "@/core/config/env";
import {
  buildClearAuthSessionCookieHeader,
  buildSetAuthSessionCookieHeader,
  resolveAuthSessionFromRequest,
} from "@/core/auth/session-cookie";
import {
  buildLoginRateLimitKey,
  checkLoginRateLimit,
  clearLoginAttempts,
  recordLoginFailure,
} from "@/core/auth/login-rate-limiter";
import { createAuthSession } from "@/features/auth/server/create-auth-session";
import { getOwnerPasswordIdentityFlags } from "@/features/auth/server/auth-identities";
import { resolveUserDisplayName } from "@/features/auth/server/resolve-user-display-name";
import { AppError, ServiceUnavailableError, UnauthorizedError } from "@/core/errors/app-error";
import { fireUsageEventSafe } from "@/features/usage/server/fire-usage-event-safe";
import {
  TRUSTED_DEVICE_COOKIE_NAME,
  buildSetTrustedDeviceCookieHeader,
} from "@/features/trusted-devices/server/trusted-device-cookie";

export const dynamic = "force-dynamic";

function resolveClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return request.headers.get("x-real-ip") || "unknown";
}

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

export async function GET(request: Request) {
  try {
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
      return ok({ authenticated: false });
    }
    const displayName = await resolveUserDisplayName(session.userId);
    const ownerFlags = session.role === "owner"
      ? await getOwnerPasswordIdentityFlags(session.userId)
      : null;
    return ok({
      authenticated: true,
      organizationId: session.organizationId,
      userId: session.userId,
      role: session.role,
      displayName,
      mustChangePassword: ownerFlags?.mustChangePassword === true,
    });
  } catch (error) {
    return failRequest(error, request);
  }
}

export async function POST(request: Request) {
  let rateKey = "";
  try {
    const env = readEnv();
    if (isServerProductionMode(env)) {
      assertProductionRuntimeEnv(env);
    }
    if (!env.DATABASE_URL) {
      throw new ServiceUnavailableError("DATABASE_URL is not configured.");
    }

    const payload = (await request.json()) as Record<string, unknown>;
    rateKey = buildLoginRateLimitKey(resolveClientIp(request), resolveLoginIdentifier(payload));
    const rateCheck = await checkLoginRateLimit(rateKey);
    if (!rateCheck.allowed) {
      throw new AppError(
        "RATE_LIMITED",
        "Too many login attempts. Try again later.",
        429,
        { retryAfterSeconds: rateCheck.retryAfterSeconds },
      );
    }

    const sessionClaims = await createAuthSession({
      ...(payload as Parameters<typeof createAuthSession>[0]),
      trustedDeviceCookie: readCookieValue(request, TRUSTED_DEVICE_COOKIE_NAME),
    });
    await clearLoginAttempts(rateKey);
    if (!env.AUTH_SESSION_SECRET || env.AUTH_SESSION_SECRET.length < 16) {
      throw new ServiceUnavailableError("AUTH_SESSION_SECRET is not configured.");
    }

    const secureCookie = env.NODE_ENV === "production" || env.APP_MODE === "production";
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
  } catch (error) {
    if (error instanceof UnauthorizedError && rateKey) {
      await recordLoginFailure(rateKey);
    }
    return failRequest(error, request);
  }
}

export async function DELETE(request: Request) {
  try {
    const env = readEnv();
    const secureCookie = env.NODE_ENV === "production" || env.APP_MODE === "production";
    return ok(
      { success: true },
      {
        headers: {
          "set-cookie": buildClearAuthSessionCookieHeader(env.AUTH_SESSION_COOKIE_NAME, secureCookie),
        },
      },
    );
  } catch (error) {
    return failRequest(error, request);
  }
}
