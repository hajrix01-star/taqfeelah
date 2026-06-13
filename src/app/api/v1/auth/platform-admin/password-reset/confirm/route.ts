import { failRequest, ok } from "@/core/http/api-response";
import { readEnv, assertProductionRuntimeEnv, isServerProductionMode } from "@/core/config/env";
import { ServiceUnavailableError } from "@/core/errors/app-error";
import { confirmPlatformAdminPasswordReset } from "@/features/auth/server/confirm-platform-admin-password-reset";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const env = readEnv();
    if (isServerProductionMode(env)) {
      assertProductionRuntimeEnv(env);
    }
    if (!env.DATABASE_URL) {
      throw new ServiceUnavailableError("DATABASE_URL is not configured.");
    }

    const body = await request.json();
    const result = await confirmPlatformAdminPasswordReset({
      token: typeof body?.token === "string" ? body.token : "",
      newPassword: typeof body?.newPassword === "string" ? body.newPassword : "",
      confirmPassword: typeof body?.confirmPassword === "string" ? body.confirmPassword : "",
    });

    return ok(result);
  } catch (error) {
    return failRequest(error, request);
  }
}
