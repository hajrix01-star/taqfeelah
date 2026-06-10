import { Redis } from "@upstash/redis";

export type RateLimitCheckResult = {
  allowed: boolean;
  retryAfterSeconds?: number;
};

export interface RateLimitStore {
  check(key: string): Promise<RateLimitCheckResult>;
  recordFailure(key: string): Promise<void>;
  clear(key: string): Promise<void>;
  resetForTests(): void;
}

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;
const WINDOW_SECONDS = Math.ceil(WINDOW_MS / 1000);

type AttemptBucket = {
  count: number;
  resetAt: number;
};

class MemoryRateLimitStore implements RateLimitStore {
  private readonly attempts = new Map<string, AttemptBucket>();

  private pruneExpired(now: number) {
    for (const [key, bucket] of this.attempts) {
      if (bucket.resetAt <= now) {
        this.attempts.delete(key);
      }
    }
  }

  async check(key: string): Promise<RateLimitCheckResult> {
    const now = Date.now();
    this.pruneExpired(now);
    const bucket = this.attempts.get(key);
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

  async recordFailure(key: string): Promise<void> {
    const now = Date.now();
    this.pruneExpired(now);
    const bucket = this.attempts.get(key);
    if (!bucket || bucket.resetAt <= now) {
      this.attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
      return;
    }
    bucket.count += 1;
  }

  async clear(key: string): Promise<void> {
    this.attempts.delete(key);
  }

  resetForTests(): void {
    this.attempts.clear();
  }
}

class UpstashRateLimitStore implements RateLimitStore {
  private readonly redis: Redis;

  private readonly keyPrefix = "ratelimit:login:";

  constructor(url: string, token: string) {
    this.redis = new Redis({ url, token });
  }

  private redisKey(key: string): string {
    return `${this.keyPrefix}${key}`;
  }

  async check(key: string): Promise<RateLimitCheckResult> {
    const redisKey = this.redisKey(key);
    const [count, ttl] = await Promise.all([
      this.redis.get<number>(redisKey),
      this.redis.ttl(redisKey),
    ]);
    const attempts = typeof count === "number" ? count : 0;
    if (attempts < MAX_ATTEMPTS) {
      return { allowed: true };
    }
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, ttl > 0 ? ttl : WINDOW_SECONDS),
    };
  }

  async recordFailure(key: string): Promise<void> {
    const redisKey = this.redisKey(key);
    const attempts = await this.redis.incr(redisKey);
    if (attempts === 1) {
      await this.redis.expire(redisKey, WINDOW_SECONDS);
    }
  }

  async clear(key: string): Promise<void> {
    await this.redis.del(this.redisKey(key));
  }

  resetForTests(): void {
    // Upstash is remote; tests use the memory store.
  }
}

let store: RateLimitStore | null = null;

export function getLoginRateLimitStore(): RateLimitStore {
  if (store) return store;

  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (url && token) {
    store = new UpstashRateLimitStore(url, token);
    return store;
  }

  store = new MemoryRateLimitStore();
  return store;
}

export function resetLoginRateLimitStoreForTests(): void {
  store = new MemoryRateLimitStore();
}

export const LOGIN_RATE_LIMIT_MAX_ATTEMPTS = MAX_ATTEMPTS;
export const LOGIN_RATE_LIMIT_WINDOW_SECONDS = WINDOW_SECONDS;
