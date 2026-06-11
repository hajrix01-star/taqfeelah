import { NextResponse, type NextRequest } from "next/server";
import { resolveEdgeAuthSessionFromRequest } from "@/core/auth/edge-session-cookie";

type SaasAdminMiddlewareEnv = {
  SAAS_ADMIN_API_ENABLED?: string;
  NEXT_PUBLIC_SAAS_ADMIN_ENABLED?: string;
  SAAS_PLATFORM_ADMIN_USER_IDS?: string;
  AUTH_SESSION_COOKIE_NAME?: string;
  AUTH_SESSION_SECRET?: string;
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function parsePlatformAdminUserIds(rawValue: string | undefined): Set<string> {
  if (!rawValue?.trim()) return new Set();
  return new Set(
    rawValue
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter((value) => UUID_RE.test(value)),
  );
}

function isPlatformAdminUser(actorUserId: string, env: SaasAdminMiddlewareEnv): boolean {
  const allowedUserIds = parsePlatformAdminUserIds(env.SAAS_PLATFORM_ADMIN_USER_IDS);
  if (!allowedUserIds.size) return false;
  return allowedUserIds.has(actorUserId.toLowerCase());
}

function jsonError(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export function isSaasAdminApiPath(pathname: string): boolean {
  return pathname.startsWith("/api/v1/saas-admin/");
}

export function isSaasAdminPagePath(pathname: string): boolean {
  return pathname === "/saas-admin" || pathname.startsWith("/saas-admin/");
}

export async function handleSaasAdminMiddleware(
  request: NextRequest,
  env: SaasAdminMiddlewareEnv = process.env as SaasAdminMiddlewareEnv,
): Promise<NextResponse | null> {
  const { pathname } = request.nextUrl;
  const isApi = isSaasAdminApiPath(pathname);
  const isPage = isSaasAdminPagePath(pathname);
  if (!isApi && !isPage) return null;

  if (isApi && env.SAAS_ADMIN_API_ENABLED !== "true") {
    return jsonError(503, "SERVICE_UNAVAILABLE", "SaaS admin API is disabled.");
  }

  if (isPage && env.NEXT_PUBLIC_SAAS_ADMIN_ENABLED !== "true") {
    return null;
  }

  if (!isApi) {
    return null;
  }

  const cookieName = env.AUTH_SESSION_COOKIE_NAME || "taqfeelah_session";
  const session = await resolveEdgeAuthSessionFromRequest(
    request,
    cookieName,
    env.AUTH_SESSION_SECRET,
  );

  if (!session?.userId) {
    return jsonError(401, "UNAUTHORIZED", "Unauthorized");
  }

  if (!isPlatformAdminUser(session.userId, env)) {
    if (!parsePlatformAdminUserIds(env.SAAS_PLATFORM_ADMIN_USER_IDS).size) {
      return jsonError(403, "FORBIDDEN", "Platform admin access is not configured.");
    }
    return jsonError(403, "FORBIDDEN", "User is not authorized for platform admin operations.");
  }

  return null;
}
