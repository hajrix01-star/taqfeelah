import { afterEach, describe, expect, it, vi } from "vitest";
import {
  isSaasAdminApiEnabled,
  isSaasAdminClientEnabled,
  isUsageTrackingEnabled,
} from "./saas-admin-api-mode";

describe("saas admin api mode", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("keeps saas admin disabled by default", () => {
    vi.stubEnv("NEXT_PUBLIC_SAAS_ADMIN_ENABLED", "");
    vi.stubEnv("SAAS_ADMIN_API_ENABLED", "");
    expect(isSaasAdminClientEnabled()).toBe(false);
    expect(isSaasAdminApiEnabled()).toBe(false);
  });

  it("enables flags only when explicitly true", () => {
    vi.stubEnv("NEXT_PUBLIC_SAAS_ADMIN_ENABLED", "true");
    vi.stubEnv("SAAS_ADMIN_API_ENABLED", "true");
    vi.stubEnv("USAGE_TRACKING_ENABLED", "true");
    expect(isSaasAdminClientEnabled()).toBe(true);
    expect(isSaasAdminApiEnabled()).toBe(true);
    expect(isUsageTrackingEnabled()).toBe(true);
  });
});
