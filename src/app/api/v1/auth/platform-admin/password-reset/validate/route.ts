import { withApiRouteNoParams } from "@/core/http/api-route-handler";
import { parsePasswordResetAudience } from "@/features/auth/server/password-reset-audience";
import { validatePasswordResetToken } from "@/features/auth/server/validate-password-reset-token";

export const dynamic = "force-dynamic";

export const GET = withApiRouteNoParams(({ searchParams }) => {
  const token = searchParams.get("token") || "";
  const audience = parsePasswordResetAudience(searchParams.get("audience")) ?? "platform_admin";
  return validatePasswordResetToken({ token, audience });
});
