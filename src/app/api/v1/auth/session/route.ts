import { fail, ok } from "@/core/http/api-response";
import { readEnv, assertProductionRuntimeEnv, isServerProductionMode } from "@/core/config/env";
import {
  buildClearAuthSessionCookieHeader,
  buildSetAuthSessionCookieHeader,
  resolveAuthSessionFromRequest,
} from "@/core/auth/session-cookie";
import { createAuthSession } from "@/features/auth/server/create-auth-session";
import { ServiceUnavailableError, AppError } from "@/core/errors/app-error";
import {
  checkLoginRateLimit,
  getClientIp,
  recordLoginFailure,
  recordLoginSuccess,
} from "@/core/auth/login-rate-limiter";

export const dynamic = "force-dynamic";

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
  const clientIp = getClientIp(request);
  const rateCheck = checkLoginRateLimit(clientIp);
  if (!rateCheck.allowed) {
    const retryAfterSec = Math.ceil((rateCheck.retryAfterMs ?? 60000) / 1000);
    return new Response(
      JSON.stringify({ error: { code: "RATE_LIMITED", message: "Too many login attempts. Try again later." } }),
      {
        status: 429,
        headers: {
          "content-type": "application/json",
          "retry-after": String(retryAfterSec),
        },
      },
    );
  }

  try {
    const env = readEnv();
    if (isServerProductionMode(env)) {
      assertProductionRuntimeEnv(env);
    }
    if (!env.DATABASE_URL) {
      throw new ServiceUnavailableError("DATABASE_URL is not configured.");
    }
    if (!env.AUTH_SESSION_SECRET || env.AUTH_SESSION_SECRET.length < 16) {
      throw new ServiceUnavailableError("AUTH_SESSION_SECRET is not configured.");
    }

    const payload = await request.json();
    const sessionClaims = await createAuthSession(payload);

    recordLoginSuccess(clientIp);

    const secureCookie = env.NODE_ENV === "production" || env.APP_MODE === "production";
    const setCookie = buildSetAuthSessionCookieHeader(
      {
        organizationId: sessionClaims.organizationId,
        userId: sessionClaims.userId,
        role: sessionClaims.role,
        cv: sessionClaims.credentialVersion ?? 0,
        ttlSeconds: 60 * 60 * 12,
      },
      env.AUTH_SESSION_COOKIE_NAME,
      env.AUTH_SESSION_SECRET,
      { secure: secureCookie },
    );

    return ok(
      {
        organizationId: sessionClaims.organizationId,
        userId: sessionClaims.userId,
        role: sessionClaims.role,
      },
      {
        headers: { "set-cookie": setCookie },
      },
    );
  } catch (error) {
    if (error instanceof AppError && (error.status === 401 || error.status === 403)) {
      recordLoginFailure(clientIp);
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
