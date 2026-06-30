import { readJsonBody, withApiRouteNoParams } from "@/core/http/api-route-handler";
import { runRateLimitedAuthRequest } from "@/features/auth/server/rate-limited-auth-request";
import { requestPlatformAdminPasswordReset } from "@/features/auth/server/request-platform-admin-password-reset";

export const dynamic = "force-dynamic";

type Body = Record<string, unknown>;

export const POST = withApiRouteNoParams(async ({ request }) => {
  const body = await readJsonBody<Body>(request);
  const email = typeof body?.email === "string" ? body.email : "";
  return runRateLimitedAuthRequest({
    request,
    key: `reset:platform:${email.toLowerCase()}`,
    rateLimitedMessage: "Too many reset attempts. Try again later.",
    action: () => requestPlatformAdminPasswordReset({ email }, request),
  });
});
