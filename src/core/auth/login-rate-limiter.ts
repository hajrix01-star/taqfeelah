const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;

type AttemptBucket = {
  count: number;
  resetAt: number;
};

const attempts = new Map<string, AttemptBucket>();

function pruneExpired(now: number) {
  for (const [key, bucket] of attempts) {
    if (bucket.resetAt <= now) {
      attempts.delete(key);
    }
  }
}

export function buildLoginRateLimitKey(ipAddress: string, identifier: string): string {
  const normalizedIp = ipAddress.trim() || "unknown-ip";
  const normalizedIdentifier = identifier.trim().toLowerCase() || "unknown-user";
  return `${normalizedIp}:${normalizedIdentifier}`;
}

export function checkLoginRateLimit(key: string): { allowed: boolean; retryAfterSeconds?: number } {
  const now = Date.now();
  pruneExpired(now);
  const bucket = attempts.get(key);
  if (!bucket || bucket.resetAt <= now) {
    return { allowed: true };
  }
  if (bucket.count < MAX_ATTEMPTS) {
    return { allowed: true };
  }
  return {
    allowed: false,
    retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
  };
}

export function recordLoginFailure(key: string): void {
  const now = Date.now();
  pruneExpired(now);
  const bucket = attempts.get(key);
  if (!bucket || bucket.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return;
  }
  bucket.count += 1;
}

export function clearLoginAttempts(key: string): void {
  attempts.delete(key);
}

export function resetLoginRateLimiterForTests(): void {
  attempts.clear();
}
