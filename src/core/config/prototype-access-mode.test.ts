import { afterEach, describe, expect, it, vi } from "vitest";
import { __resetEnvCacheForTests } from "@/core/config/env";
import { isPrototypeAccessMode } from "@/core/config/prototype-access-mode";

describe("isPrototypeAccessMode", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    __resetEnvCacheForTests();
  });

  it("is disabled in production app mode", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_APP_MODE", "production");
    expect(isPrototypeAccessMode()).toBe(false);
  });

  it("is enabled in development prototype by default", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_APP_MODE", "prototype");
    expect(isPrototypeAccessMode()).toBe(true);
  });

  it("can be opted out explicitly in non-production builds", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_APP_MODE", "prototype");
    vi.stubEnv("NEXT_PUBLIC_PROTOTYPE_ACCESS_MODE", "false");
    expect(isPrototypeAccessMode()).toBe(false);
  });

  it("can be opted in explicitly for LAN mobile preview builds", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_APP_MODE", "prototype");
    vi.stubEnv("NEXT_PUBLIC_PROTOTYPE_ACCESS_MODE", "true");
    expect(isPrototypeAccessMode()).toBe(true);
  });
});
