import { readJsonBody, withApiRouteNoParams } from "@/core/http/api-route-handler";
import { runRateLimitedAuthRequest } from "@/features/auth/server/rate-limited-auth-request";
import { requestOwnerPasswordReset } from "@/features/auth/server/request-owner-password-reset";

export const dynamic = "force-dynamic";

type Body = Record<string, unknown>;

export const POST = withApiRouteNoParams(async ({ request }) => {
  const body = await readJsonBody<Body>(request);
  const email = typeof body?.email === "string" ? body.email : "";
  return runRateLimitedAuthRequest({
    request,
    key: `reset:${email.toLowerCase()}`,
    rateLimitedMessage: "Too many reset attempts. Try again later.",
    action: () => requestOwnerPasswordReset({ email }, request),
  });
});
