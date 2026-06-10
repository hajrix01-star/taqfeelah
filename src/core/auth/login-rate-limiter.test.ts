import { afterEach, describe, expect, it } from "vitest";
import {
  buildLoginRateLimitKey,
  checkLoginRateLimit,
  clearLoginAttempts,
  recordLoginFailure,
  resetLoginRateLimiterForTests,
} from "./login-rate-limiter";

describe("login-rate-limiter", () => {
  afterEach(() => {
    resetLoginRateLimiterForTests();
  });

  it("allows attempts under the limit", async () => {
    const key = buildLoginRateLimitKey("127.0.0.1", "owner");
    expect((await checkLoginRateLimit(key)).allowed).toBe(true);
    for (let i = 0; i < 9; i += 1) {
      await recordLoginFailure(key);
    }
    expect((await checkLoginRateLimit(key)).allowed).toBe(true);
  });

  it("blocks after max attempts and clears on success", async () => {
    const key = buildLoginRateLimitKey("127.0.0.1", "owner");
    for (let i = 0; i < 10; i += 1) {
      await recordLoginFailure(key);
    }
    const blocked = await checkLoginRateLimit(key);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);

    await clearLoginAttempts(key);
    expect((await checkLoginRateLimit(key)).allowed).toBe(true);
  });
});
