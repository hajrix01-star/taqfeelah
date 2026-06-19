import { describe, expect, it } from "vitest";
import {
  canForceUpdateOwnerIdentity,
  envFlagEnabled,
  hasExplicitEnvValue,
  shouldPreserveExistingOwnerIdentity,
} from "./auth-seed-policy.mjs";

describe("auth-seed-policy", () => {
  it("preserves existing owner identity by default", () => {
    expect(shouldPreserveExistingOwnerIdentity({})).toBe(true);
    expect(shouldPreserveExistingOwnerIdentity({ AUTH_OWNER_USERNAME: "hajri" })).toBe(true);
  });

  it("allows forced owner overwrite only with explicit credentials", () => {
    expect(
      canForceUpdateOwnerIdentity({
        AUTH_SEED_FORCE_OWNER_CREDENTIALS: "true",
        AUTH_OWNER_USERNAME: "owner@taqfeelah.com",
        AUTH_OWNER_PASSWORD: "secret",
      }),
    ).toBe(true);

    expect(
      canForceUpdateOwnerIdentity({
        AUTH_SEED_FORCE_OWNER_CREDENTIALS: "true",
      }),
    ).toBe(false);

    expect(
      canForceUpdateOwnerIdentity({
        AUTH_SEED_FORCE_OWNER_CREDENTIALS: "true",
        AUTH_OWNER_USERNAME: "owner@taqfeelah.com",
      }),
    ).toBe(false);
  });

  it("treats force flag as disabled unless exactly true", () => {
    expect(envFlagEnabled({ AUTH_SEED_FORCE_OWNER_CREDENTIALS: "false" }, "AUTH_SEED_FORCE_OWNER_CREDENTIALS")).toBe(
      false,
    );
    expect(shouldPreserveExistingOwnerIdentity({ AUTH_SEED_FORCE_OWNER_CREDENTIALS: "1" })).toBe(true);
  });

  it("detects explicit env values", () => {
    expect(hasExplicitEnvValue({ AUTH_OWNER_USERNAME: "  " }, "AUTH_OWNER_USERNAME")).toBe(false);
    expect(hasExplicitEnvValue({ AUTH_OWNER_USERNAME: "owner@taqfeelah.com" }, "AUTH_OWNER_USERNAME")).toBe(true);
  });
});
