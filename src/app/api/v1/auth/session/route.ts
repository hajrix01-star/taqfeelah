import { fail, ok } from "@/core/http/api-response";
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
import { AppError, ServiceUnavailableError, UnauthorizedError } from "@/core/errors/app-error";
import { fireUsageEventSafe } from "@/features/usage/server/fire-usage-event-safe";

export const dynamic = "force-dynamic";

function resolveClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return request.headers.get("x-real-ip") || "unknown";
}

function resolveLoginIdentifier(payload: Record<string, unknown>): string {
  if (payload.mode === "employee_pin") {
    return typeof payload.employeeId === "string" ? payload.employeeId : "";
  }
  return typeof payload.username === "string" ? payload.username : "";
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
    return ok({
      authenticated: true,
      organizationId: session.organizationId,
      userId: session.userId,
      role: session.role,
    });
  } catch (error) {
    return fail(error);
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
    const rateCheck = checkLoginRateLimit(rateKey);
    if (!rateCheck.allowed) {
      throw new AppError(
        "RATE_LIMITED",
        "Too many login attempts. Try again later.",
        429,
        { retryAfterSeconds: rateCheck.retryAfterSeconds },
      );
    }

    const sessionClaims = await createAuthSession(
      payload as Parameters<typeof createAuthSession>[0],
    );
    clearLoginAttempts(rateKey);
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

    return ok(
      {
        organizationId: sessionClaims.organizationId,
        userId: sessionClaims.userId,
        role: sessionClaims.role,
      },
      {
        headers: {
          "set-cookie": setCookie,
        },
      },
    );
  } catch (error) {
    if (error instanceof UnauthorizedError && rateKey) {
      recordLoginFailure(rateKey);
    }
    return fail(error);
  }
}

export async function DELETE() {
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
    return fail(error);
  }
}
