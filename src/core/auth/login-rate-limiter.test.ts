import { describe, expect, it, beforeEach } from "vitest";

describe("login-rate-limiter", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("allows first request", async () => {
    const { checkLoginRateLimit } = await import("@/core/auth/login-rate-limiter");
    const result = checkLoginRateLimit("192.168.0.1");
    expect(result.allowed).toBe(true);
  });

  it("blocks after 10 failed attempts", async () => {
    const { checkLoginRateLimit, recordLoginFailure } = await import("@/core/auth/login-rate-limiter");
    const ip = "10.0.0.1";
    for (let i = 0; i < 10; i++) recordLoginFailure(ip);
    const result = checkLoginRateLimit(ip);
    expect(result.allowed).toBe(false);
    expect(result.retryAfterMs).toBeGreaterThan(0);
  });

  it("clears record on successful login", async () => {
    const { checkLoginRateLimit, recordLoginFailure, recordLoginSuccess } = await import("@/core/auth/login-rate-limiter");
    const ip = "10.0.0.2";
    for (let i = 0; i < 5; i++) recordLoginFailure(ip);
    recordLoginSuccess(ip);
    const result = checkLoginRateLimit(ip);
    expect(result.allowed).toBe(true);
  });
});

import { vi } from "vitest";
