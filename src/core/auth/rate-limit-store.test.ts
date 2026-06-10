import { afterEach, describe, expect, it } from "vitest";
import {
  LOGIN_RATE_LIMIT_MAX_ATTEMPTS,
  resetLoginRateLimitStoreForTests,
  getLoginRateLimitStore,
} from "./rate-limit-store";

describe("memory rate-limit-store", () => {
  afterEach(() => {
    resetLoginRateLimitStoreForTests();
  });

  it("tracks failures up to the configured max", async () => {
    const store = getLoginRateLimitStore();
    const key = "127.0.0.1:owner";

    for (let i = 0; i < LOGIN_RATE_LIMIT_MAX_ATTEMPTS - 1; i += 1) {
      await store.recordFailure(key);
    }
    expect((await store.check(key)).allowed).toBe(true);

    await store.recordFailure(key);
    const blocked = await store.check(key);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("clears attempts after successful login", async () => {
    const store = getLoginRateLimitStore();
    const key = "127.0.0.1:employee";

    for (let i = 0; i < LOGIN_RATE_LIMIT_MAX_ATTEMPTS; i += 1) {
      await store.recordFailure(key);
    }
    expect((await store.check(key)).allowed).toBe(false);

    await store.clear(key);
    expect((await store.check(key)).allowed).toBe(true);
  });
});
