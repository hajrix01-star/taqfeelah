import { afterEach, describe, expect, it, vi } from "vitest";
import { isOrgConfigApiEnabled } from "./org-config-api-mode";

describe("org config api mode", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("enables org config API when explicitly true", () => {
    vi.stubEnv("NEXT_PUBLIC_ORG_CONFIG_API_ENABLED", "true");
    vi.stubEnv("NEXT_PUBLIC_ENTRIES_API_ENABLED", "false");
    expect(isOrgConfigApiEnabled()).toBe(true);
  });

  it("inherits entries API flag when org config flag is unset", () => {
    vi.stubEnv("NEXT_PUBLIC_ORG_CONFIG_API_ENABLED", "");
    vi.stubEnv("NEXT_PUBLIC_ENTRIES_API_ENABLED", "true");
    expect(isOrgConfigApiEnabled()).toBe(true);
  });
});
