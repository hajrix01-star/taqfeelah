import { afterEach, describe, expect, it, vi } from "vitest";
import { readPublicAppMode, readServerAppMode } from "@/core/config/app-mode";

describe("app mode", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("honors explicit NEXT_PUBLIC_APP_MODE=local in production NODE_ENV", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_APP_MODE", "local");
    expect(readPublicAppMode()).toBe("local");
  });

  it("defaults to production when NODE_ENV is production and mode is unset", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_APP_MODE", "");
    expect(readPublicAppMode()).toBe("production");
  });

  it("honors explicit APP_MODE=local on the server in production NODE_ENV", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("APP_MODE", "local");
    expect(readServerAppMode()).toBe("local");
  });
});
