import { readJsonBody, withApiRouteNoParams } from "@/core/http/api-route-handler";
import { confirmPlatformAdminPasswordReset } from "@/features/auth/server/confirm-platform-admin-password-reset";

export const dynamic = "force-dynamic";

type Body = Record<string, unknown>;

export const POST = withApiRouteNoParams(async ({ request }) => {
  const body = await readJsonBody<Body>(request);
  return confirmPlatformAdminPasswordReset({
    token: typeof body?.token === "string" ? body.token : "",
    newPassword: typeof body?.newPassword === "string" ? body.newPassword : "",
    confirmPassword: typeof body?.confirmPassword === "string" ? body.confirmPassword : "",
  });
});
