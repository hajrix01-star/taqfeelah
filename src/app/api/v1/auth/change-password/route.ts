import { readJsonBody, withAuthedApiRouteNoParams } from "@/core/http/api-route-handler";
import { ValidationError } from "@/core/errors/app-error";
import { changeOwnerPassword } from "@/features/auth/server/change-owner-password";

export const dynamic = "force-dynamic";

type Body = Record<string, unknown>;

export const POST = withAuthedApiRouteNoParams(async ({ auth, request }) => {
  if (auth.role !== "owner") {
    throw new ValidationError("Only owners can change owner passwords.");
  }

  const body = await readJsonBody<Body>(request);
  return changeOwnerPassword({
    userId: auth.userId,
    currentPassword: typeof body?.currentPassword === "string" ? body.currentPassword : "",
    newPassword: typeof body?.newPassword === "string" ? body.newPassword : "",
  });
});
