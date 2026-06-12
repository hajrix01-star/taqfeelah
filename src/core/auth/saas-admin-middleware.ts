import { NextResponse, type NextRequest } from "next/server";
import { resolveEdgeAuthSessionFromRequest } from "@/core/auth/edge-session-cookie";
import { resolvePublicOriginFromRequest } from "@/core/http/resolve-request-public-origin";

type SaasAdminMiddlewareEnv = {
  SAAS_ADMIN_API_ENABLED?: string;
  NEXT_PUBLIC_SAAS_ADMIN_ENABLED?: string;
  AUTH_SESSION_COOKIE_NAME?: string;
  AUTH_SESSION_SECRET?: string;
};

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

  if (
    isPage
    && pathname !== "/saas-admin/login"
    && env.NEXT_PUBLIC_SAAS_ADMIN_ENABLED === "true"
  ) {
    const cookieName = env.AUTH_SESSION_COOKIE_NAME || "taqfeelah_session";
    const session = await resolveEdgeAuthSessionFromRequest(
      request,
      cookieName,
      env.AUTH_SESSION_SECRET,
    );
    if (!session?.userId) {
      const loginUrl = new URL("/saas-admin/login", resolvePublicOriginFromRequest(request));
      loginUrl.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
      return NextResponse.redirect(loginUrl);
    }
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

  // Platform-admin authorization runs in Node route handlers (assertSaasAdminRouteReady)
  // so env allowlists match server layout/readEnv — Edge middleware env can diverge on VPS.
  return null;
}
