import type { NextRequest } from "next/server";
import { handleSaasAdminMiddleware } from "@/core/auth/saas-admin-middleware";
import { applySecurityHeaders } from "@/core/security/apply-security-headers";

export async function middleware(request: NextRequest) {
  const saasResponse = await handleSaasAdminMiddleware(request);
  return applySecurityHeaders(request, saasResponse ?? undefined);
}

export const config = {
  matcher: [
    "/saas-admin/:path*",
    "/api/v1/saas-admin/:path*",
    {
      source: "/((?!_next/static|_next/image|favicon.ico|icons/|sw.js|~offline|manifest.webmanifest).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
