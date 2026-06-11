import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { handleSaasAdminMiddleware } from "@/core/auth/saas-admin-middleware";

export async function middleware(request: NextRequest) {
  const blocked = await handleSaasAdminMiddleware(request);
  if (blocked) return blocked;
  return NextResponse.next();
}

export const config = {
  matcher: ["/saas-admin/:path*", "/api/v1/saas-admin/:path*"],
};
