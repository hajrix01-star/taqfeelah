/**
 * In-memory login rate limiter.
 * Limits failed login attempts per IP to prevent brute-force attacks.
 * State is per-process — suitable for single-server deployment.
 * For multi-server, replace with Redis-backed store.
 */

const MAX_ATTEMPTS = 10;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

type AttemptRecord = {
  count: number;
  windowStart: number;
  lockedUntil?: number;
};

const attempts = new Map<string, AttemptRecord>();

/** Purge stale entries every 5 minutes */
if (typeof setInterval !== "undefined") {
  setInterval(
    () => {
      const now = Date.now();
      for (const [key, record] of attempts.entries()) {
        if (now - record.windowStart > WINDOW_MS * 2) {
          attempts.delete(key);
        }
      }
    },
    5 * 60 * 1000,
  );
}

export function checkLoginRateLimit(ip: string): { allowed: boolean; retryAfterMs?: number } {
  const now = Date.now();
  const record = attempts.get(ip);

  if (record?.lockedUntil && now < record.lockedUntil) {
    return { allowed: false, retryAfterMs: record.lockedUntil - now };
  }

  if (!record || now - record.windowStart > WINDOW_MS) {
    attempts.set(ip, { count: 0, windowStart: now });
    return { allowed: true };
  }

  return { allowed: true };
}

export function recordLoginFailure(ip: string): void {
  const now = Date.now();
  const record = attempts.get(ip) ?? { count: 0, windowStart: now };

  if (now - record.windowStart > WINDOW_MS) {
    attempts.set(ip, { count: 1, windowStart: now });
    return;
  }

  const next: AttemptRecord = { count: record.count + 1, windowStart: record.windowStart };
  if (next.count >= MAX_ATTEMPTS) {
    next.lockedUntil = now + LOCKOUT_MS;
  }
  attempts.set(ip, next);
}

export function recordLoginSuccess(ip: string): void {
  attempts.delete(ip);
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0].trim();
    if (first) return first;
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "unknown";
}
