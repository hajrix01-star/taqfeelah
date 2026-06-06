import { afterEach, describe, expect, it, vi } from "vitest";
import { __resetEnvCacheForTests } from "@/core/config/env";
import { isPrototypeAccessMode } from "@/core/config/prototype-access-mode";

describe("isPrototypeAccessMode", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    __resetEnvCacheForTests();
  });

  it("is enabled by default in production app mode", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_APP_MODE", "production");
    expect(isPrototypeAccessMode()).toBe(true);
  });

  it("is enabled in development by default", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_APP_MODE", "prototype");
    expect(isPrototypeAccessMode()).toBe(true);
  });

  it("can be opted out explicitly before launch", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_APP_MODE", "production");
    vi.stubEnv("NEXT_PUBLIC_PROTOTYPE_ACCESS_MODE", "false");
    expect(isPrototypeAccessMode()).toBe(false);
  });
});
