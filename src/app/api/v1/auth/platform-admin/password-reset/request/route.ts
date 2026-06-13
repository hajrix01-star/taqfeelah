import { failRequest, ok } from "@/core/http/api-response";
import { readEnv, assertProductionRuntimeEnv, isServerProductionMode } from "@/core/config/env";
import {
  buildLoginRateLimitKey,
  checkLoginRateLimit,
  recordLoginFailure,
} from "@/core/auth/login-rate-limiter";
import { AppError, ServiceUnavailableError, UnauthorizedError } from "@/core/errors/app-error";
import { requestPlatformAdminPasswordReset } from "@/features/auth/server/request-platform-admin-password-reset";

export const dynamic = "force-dynamic";

function resolveClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip") || "unknown";
}

export async function POST(request: Request) {
  let rateKey = "";
  try {
    const env = readEnv();
    if (isServerProductionMode(env)) {
      assertProductionRuntimeEnv(env);
    }
    if (!env.DATABASE_URL) {
      throw new ServiceUnavailableError("DATABASE_URL is not configured.");
    }

    const body = await request.json();
    const email = typeof body?.email === "string" ? body.email : "";
    rateKey = buildLoginRateLimitKey(resolveClientIp(request), `reset:platform:${email.toLowerCase()}`);
    const rateCheck = await checkLoginRateLimit(rateKey);
    if (!rateCheck.allowed) {
      throw new AppError(
        "RATE_LIMITED",
        "Too many reset attempts. Try again later.",
        429,
        { retryAfterSeconds: rateCheck.retryAfterSeconds },
      );
    }

    const result = await requestPlatformAdminPasswordReset({ email }, request);
    return ok(result);
  } catch (error) {
    if ((error instanceof UnauthorizedError || error instanceof AppError) && rateKey) {
      await recordLoginFailure(rateKey);
    }
    return failRequest(error, request);
  }
}
