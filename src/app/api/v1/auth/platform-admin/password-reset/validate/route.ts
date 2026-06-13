import { failRequest, ok } from "@/core/http/api-response";
import { ServiceUnavailableError } from "@/core/errors/app-error";
import { readEnv } from "@/core/config/env";
import { parsePasswordResetAudience } from "@/features/auth/server/password-reset-audience";
import { validatePasswordResetToken } from "@/features/auth/server/validate-password-reset-token";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const env = readEnv();
    if (!env.DATABASE_URL) {
      throw new ServiceUnavailableError("DATABASE_URL is not configured.");
    }

    const searchParams = new URL(request.url).searchParams;
    const token = searchParams.get("token") || "";
    const audience = parsePasswordResetAudience(searchParams.get("audience")) ?? "platform_admin";
    const result = await validatePasswordResetToken({ token, audience });
    return ok(result);
  } catch (error) {
    return failRequest(error, request);
  }
}
