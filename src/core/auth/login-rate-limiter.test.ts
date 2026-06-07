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

  it("allows attempts under the limit", () => {
    const key = buildLoginRateLimitKey("127.0.0.1", "owner");
    expect(checkLoginRateLimit(key).allowed).toBe(true);
    for (let i = 0; i < 9; i += 1) {
      recordLoginFailure(key);
    }
    expect(checkLoginRateLimit(key).allowed).toBe(true);
  });

  it("blocks after max attempts and clears on success", () => {
    const key = buildLoginRateLimitKey("127.0.0.1", "owner");
    for (let i = 0; i < 10; i += 1) {
      recordLoginFailure(key);
    }
    const blocked = checkLoginRateLimit(key);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);

    clearLoginAttempts(key);
    expect(checkLoginRateLimit(key).allowed).toBe(true);
  });
});
