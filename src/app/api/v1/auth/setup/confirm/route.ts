import { fail } from "@/core/http/api-response";
import { buildSetAuthSessionCookieHeader } from "@/core/auth/session-cookie";
import { readEnv } from "@/core/config/env";
import { ServiceUnavailableError } from "@/core/errors/app-error";
import { completeAccountSetup } from "@/features/account-setup/server/complete-account-setup";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const env = readEnv();
    if (!env.AUTH_SESSION_SECRET || env.AUTH_SESSION_SECRET.length < 16) {
      throw new ServiceUnavailableError("AUTH_SESSION_SECRET is not configured.");
    }

    const body = await request.json();
    const session = await completeAccountSetup({
      token: typeof body?.token === "string" ? body.token : "",
      password: typeof body?.password === "string" ? body.password : "",
      confirmPassword: typeof body?.confirmPassword === "string" ? body.confirmPassword : "",
    });

    const secureCookie = env.NODE_ENV === "production" || env.APP_MODE === "production";
    const setCookie = buildSetAuthSessionCookieHeader(
      {
        organizationId: session.organizationId,
        userId: session.userId,
        role: session.role,
        ttlSeconds: 60 * 60 * 12,
      },
      env.AUTH_SESSION_COOKIE_NAME,
      env.AUTH_SESSION_SECRET,
      { secure: secureCookie },
    );

    return new Response(JSON.stringify(session), {
      status: 200,
      headers: {
        "content-type": "application/json",
        "set-cookie": setCookie,
      },
    });
  } catch (error) {
    return fail(error);
  }
}
