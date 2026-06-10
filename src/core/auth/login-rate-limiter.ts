import { getLoginRateLimitStore, resetLoginRateLimitStoreForTests } from "@/core/auth/rate-limit-store";

export function buildLoginRateLimitKey(ipAddress: string, identifier: string): string {
  const normalizedIp = ipAddress.trim() || "unknown-ip";
  const normalizedIdentifier = identifier.trim().toLowerCase() || "unknown-user";
  return `${normalizedIp}:${normalizedIdentifier}`;
}

export async function checkLoginRateLimit(key: string): Promise<{ allowed: boolean; retryAfterSeconds?: number }> {
  return getLoginRateLimitStore().check(key);
}

export async function recordLoginFailure(key: string): Promise<void> {
  await getLoginRateLimitStore().recordFailure(key);
}

export async function clearLoginAttempts(key: string): Promise<void> {
  await getLoginRateLimitStore().clear(key);
}

export function resetLoginRateLimiterForTests(): void {
  resetLoginRateLimitStoreForTests();
}
