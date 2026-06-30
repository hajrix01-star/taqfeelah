import { withApiRouteNoParams } from "@/core/http/api-route-handler";
import { validatePasswordResetToken } from "@/features/auth/server/validate-password-reset-token";

export const dynamic = "force-dynamic";

export const GET = withApiRouteNoParams(({ searchParams }) => {
  const token = searchParams.get("token") || "";
  const audience = searchParams.get("audience") === "platform_admin" ? "platform_admin" : "owner";
  return validatePasswordResetToken({ token, audience });
});
