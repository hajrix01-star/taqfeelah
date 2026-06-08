import { afterEach, describe, expect, it, vi } from "vitest";
import { __resetEnvCacheForTests } from "@/core/config/env";
import { isPrototypeAccessMode } from "@/core/config/prototype-access-mode";

describe("isPrototypeAccessMode", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    __resetEnvCacheForTests();
  });

  it("is disabled by default in production app mode", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_APP_MODE", "production");
    expect(isPrototypeAccessMode()).toBe(false);
  });

  it("is enabled in development by default", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_APP_MODE", "prototype");
    expect(isPrototypeAccessMode()).toBe(true);
  });

  it("can be enabled explicitly for prototype environments", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_APP_MODE", "prototype");
    expect(isPrototypeAccessMode()).toBe(true);
  });

  it("can be opted out explicitly before launch", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_APP_MODE", "production");
    vi.stubEnv("NEXT_PUBLIC_PROTOTYPE_ACCESS_MODE", "false");
    expect(isPrototypeAccessMode()).toBe(false);
  });

  it("explicit flag wins over app mode for isolated previews", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_APP_MODE", "production");
    vi.stubEnv("NEXT_PUBLIC_PROTOTYPE_ACCESS_MODE", "true");
    expect(isPrototypeAccessMode()).toBe(true);
  });
});
