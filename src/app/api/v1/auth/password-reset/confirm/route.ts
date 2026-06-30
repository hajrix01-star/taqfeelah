import { readJsonBody, withApiRouteNoParams } from "@/core/http/api-route-handler";
import { confirmOwnerPasswordReset } from "@/features/auth/server/confirm-owner-password-reset";

export const dynamic = "force-dynamic";

type Body = Record<string, unknown>;

export const POST = withApiRouteNoParams(async ({ request }) => {
  const body = await readJsonBody<Body>(request);
  return confirmOwnerPasswordReset({
    token: typeof body?.token === "string" ? body.token : "",
    newPassword: typeof body?.newPassword === "string" ? body.newPassword : "",
    confirmPassword: typeof body?.confirmPassword === "string" ? body.confirmPassword : "",
  });
});
