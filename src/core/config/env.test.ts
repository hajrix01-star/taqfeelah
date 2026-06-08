import { afterEach, describe, expect, it, vi } from "vitest";
import { ServiceUnavailableError } from "@/core/errors/app-error";
import { __resetEnvCacheForTests, allowHeaderAuthContext, assertProductionRuntimeEnv } from "./env";

const productionEnv = {
  NODE_ENV: "production",
  APP_MODE: "production",
  NEXT_PUBLIC_APP_MODE: "production",
  DATABASE_URL: "postgres://example",
  AUTH_SESSION_SECRET: "test-session-secret-32chars",
  NEXT_PUBLIC_CLOSEOUTS_API_ENABLED: "true",
  NEXT_PUBLIC_ENTRIES_API_ENABLED: "true",
  NEXT_PUBLIC_ORG_CONFIG_API_ENABLED: "true",
  NEXT_PUBLIC_PHASE9_API_ENABLED: "true",
  NEXT_PUBLIC_REGISTER_ENTRIES_PAGINATION_ENABLED: "true",
  NEXT_PUBLIC_AUTH_API_ENABLED: "true",
  AUTH_DB_CREDENTIALS_ENABLED: "true",
  NEXT_PUBLIC_DISABLE_BROWSER_PERSISTENCE: "true",
  AUTH_ORGANIZATION_ID: "00000000-0000-4000-8000-000000000001",
  AUTH_OWNER_USER_ID: "00000000-0000-4000-8000-000000000002",
  NEXT_PUBLIC_CLOSEOUTS_USER_ID_MAP: JSON.stringify({ owner: "00000000-0000-4000-8000-000000000002" }),
  NEXT_PUBLIC_CLOSEOUTS_STORE_ID_MAP: JSON.stringify({ store1: "00000000-0000-4000-8000-000000000003" }),
  NEXT_PUBLIC_CLOSEOUTS_SALES_CHANNEL_ID_MAP: JSON.stringify({ cash: "00000000-0000-4000-8000-000000000004" }),
  NEXT_PUBLIC_PROTOTYPE_ACCESS_MODE: "false",
  ALLOW_HEADER_AUTH_CONTEXT: "false",
} as const;

function stubProductionEnv(overrides: Record<string, string | undefined> = {}) {
  Object.entries({ ...productionEnv, ...overrides }).forEach(([key, value]) => {
    if (value !== undefined) {
      vi.stubEnv(key, value);
    }
  });
  __resetEnvCacheForTests();
}

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

describe("assertProductionRuntimeEnv", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    __resetEnvCacheForTests();
  });

  it("no-ops outside production mode", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("APP_MODE", "prototype");
    __resetEnvCacheForTests();

    expect(() => assertProductionRuntimeEnv()).not.toThrow();
  });

  it("accepts a complete production env", () => {
    stubProductionEnv();
    expect(() => assertProductionRuntimeEnv()).not.toThrow();
  });

  it("rejects prototype access in production unified mode", () => {
    stubProductionEnv({ NEXT_PUBLIC_PROTOTYPE_ACCESS_MODE: "true", ALLOW_HEADER_AUTH_CONTEXT: "true" });
    expect(() => assertProductionRuntimeEnv()).toThrow(ServiceUnavailableError);
    expect(() => assertProductionRuntimeEnv()).toThrow(/NEXT_PUBLIC_PROTOTYPE_ACCESS_MODE=false/);
  });

  it("rejects production without DB credentials auth", () => {
    stubProductionEnv({
      AUTH_DB_CREDENTIALS_ENABLED: "false",
    });
    expect(() => assertProductionRuntimeEnv()).toThrow(ServiceUnavailableError);
    expect(() => assertProductionRuntimeEnv()).toThrow(/AUTH_DB_CREDENTIALS_ENABLED=true/);
  });

  it("rejects header auth bypass in production unified mode", () => {
    stubProductionEnv({ ALLOW_HEADER_AUTH_CONTEXT: "true" });
    expect(() => assertProductionRuntimeEnv()).toThrow(ServiceUnavailableError);
    expect(() => assertProductionRuntimeEnv()).toThrow(/ALLOW_HEADER_AUTH_CONTEXT=false/);
  });

  it("rejects production when required DB API flags are incomplete", () => {
    stubProductionEnv({
      NEXT_PUBLIC_ORG_CONFIG_API_ENABLED: "false",
      NEXT_PUBLIC_AUTH_API_ENABLED: "false",
    });
    expect(() => assertProductionRuntimeEnv()).toThrow(ServiceUnavailableError);
    expect(() => assertProductionRuntimeEnv()).toThrow(/NEXT_PUBLIC_ORG_CONFIG_API_ENABLED=true/);
    expect(() => assertProductionRuntimeEnv()).toThrow(/NEXT_PUBLIC_AUTH_API_ENABLED=true/);
  });
});
