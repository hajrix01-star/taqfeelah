import { readJsonBody, withApiRouteNoParams } from "@/core/http/api-route-handler";
import { runRateLimitedAuthRequest } from "@/features/auth/server/rate-limited-auth-request";
import { requestPublicSignup } from "@/features/signup/server/request-public-signup";

export const dynamic = "force-dynamic";

type Body = Record<string, unknown>;

export const POST = withApiRouteNoParams(async ({ request }) => {
  const body = await readJsonBody<Body>(request);
  const email = typeof body?.email === "string" ? body.email : "";
  return runRateLimitedAuthRequest({
    request,
    key: `signup:${email.toLowerCase()}`,
    rateLimitedMessage: "Too many signup attempts. Try again later.",
    action: () => requestPublicSignup(
      {
        organizationName: typeof body?.organizationName === "string" ? body.organizationName : "",
        ownerName: typeof body?.ownerName === "string" ? body.ownerName : "",
        ownerPhone: typeof body?.ownerPhone === "string" ? body.ownerPhone : "",
        email,
        storeName: typeof body?.storeName === "string" ? body.storeName : undefined,
        planCode: "trial",
      },
      request,
    ),
  });
});
