import { failRequest, ok } from "@/core/http/api-response";
import { ServiceUnavailableError } from "@/core/errors/app-error";
import { readEnv } from "@/core/config/env";
import { validatePasswordResetToken } from "@/features/auth/server/validate-password-reset-token";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const env = readEnv();
    if (!env.DATABASE_URL) {
      throw new ServiceUnavailableError("DATABASE_URL is not configured.");
    }

    const token = new URL(request.url).searchParams.get("token") || "";
    const result = await validatePasswordResetToken({ token });
    return ok(result);
  } catch (error) {
    return failRequest(error, request);
  }
}
