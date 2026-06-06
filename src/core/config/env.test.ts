import { afterEach, describe, expect, it, vi } from "vitest";
import { __resetEnvCacheForTests, allowHeaderAuthContext } from "./env";

describe("allowHeaderAuthContext", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    __resetEnvCacheForTests();
  });

  it("defaults to true in non-production environments", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("APP_MODE", "prototype");
    __resetEnvCacheForTests();

    expect(allowHeaderAuthContext()).toBe(true);
  });

  it("defaults to false in production when not explicitly overridden", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("APP_MODE", "production");
    __resetEnvCacheForTests();

    expect(allowHeaderAuthContext()).toBe(false);
  });

  it("honors explicit true override in production NODE_ENV", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("APP_MODE", "production");
    vi.stubEnv("ALLOW_HEADER_AUTH_CONTEXT", "true");
    __resetEnvCacheForTests();

    expect(allowHeaderAuthContext()).toBe(true);
  });

  it("honors explicit false override in development", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("ALLOW_HEADER_AUTH_CONTEXT", "false");
    __resetEnvCacheForTests();

    expect(allowHeaderAuthContext()).toBe(false);
  });
});
