import {
  buildLoginRateLimitKey,
  checkLoginRateLimit,
  clearLoginAttempts,
  recordLoginFailure,
} from "@/core/auth/login-rate-limiter";
import { AppError, UnauthorizedError } from "@/core/errors/app-error";

function resolveClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip") || "unknown";
}

export async function runRateLimitedAuthRequest<T>({
  request,
  key,
  rateLimitedMessage,
  clearOnSuccess = false,
  recordFailureFor,
  action,
}: {
  request: Request;
  key: string;
  rateLimitedMessage: string;
  clearOnSuccess?: boolean;
  recordFailureFor?: (error: unknown) => boolean;
  action: () => Promise<T>;
}): Promise<T> {
  const rateKey = buildLoginRateLimitKey(resolveClientIp(request), key);
  const rateCheck = await checkLoginRateLimit(rateKey);
  if (!rateCheck.allowed) {
    throw new AppError("RATE_LIMITED", rateLimitedMessage, 429, {
      retryAfterSeconds: rateCheck.retryAfterSeconds,
    });
  }

  try {
    const result = await action();
    if (clearOnSuccess) {
      await clearLoginAttempts(rateKey);
    }
    return result;
  } catch (error) {
    const shouldRecordFailure = recordFailureFor
      ? recordFailureFor(error)
      : error instanceof UnauthorizedError || error instanceof AppError;
    if (shouldRecordFailure) {
      await recordLoginFailure(rateKey);
    }
    throw error;
  }
}
