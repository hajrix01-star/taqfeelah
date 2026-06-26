import { describe, expect, it } from "vitest";
import {
  assertOwnerCredentialResetEnv,
  assertSafeAuthSeedEnv,
  canForceUpdateOwnerIdentity,
  envFlagEnabled,
  hasExplicitEnvValue,
  ownerCredentialResetConfirmed,
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

  it("requires explicit production seed credentials and employee pins", () => {
    expect(() => assertSafeAuthSeedEnv({ APP_MODE: "production" })).toThrow(/AUTH_OWNER_USER_ID/);
    expect(() => assertSafeAuthSeedEnv({
      APP_MODE: "production",
      AUTH_OWNER_USER_ID: "e8f3e35b-6051-4da3-8b10-979700c2f00f",
      AUTH_OWNER_USERNAME: "owner@taqfeelah.com",
      AUTH_OWNER_PASSWORD: "secret",
    })).toThrow(/SEED_EMPLOYEE_PIN_MAP/);
    expect(() => assertSafeAuthSeedEnv({
      APP_MODE: "production",
      AUTH_OWNER_USER_ID: "e8f3e35b-6051-4da3-8b10-979700c2f00f",
      AUTH_OWNER_USERNAME: "owner@taqfeelah.com",
      AUTH_OWNER_PASSWORD: "secret",
      SEED_EMPLOYEE_PIN_MAP: "{}",
    })).not.toThrow();
  });

  it("requires explicit confirmation for owner credential rotation", () => {
    expect(ownerCredentialResetConfirmed({ AUTH_OWNER_RESET_CONFIRM: "rotate-owner-auth" })).toBe(true);
    expect(ownerCredentialResetConfirmed({ AUTH_OWNER_RESET_CONFIRM: "yes" })).toBe(false);
    expect(() => assertOwnerCredentialResetEnv({
      AUTH_OWNER_USER_ID: "e8f3e35b-6051-4da3-8b10-979700c2f00f",
      AUTH_OWNER_USERNAME: "owner@taqfeelah.com",
      AUTH_OWNER_PASSWORD: "secret",
    })).toThrow(/AUTH_OWNER_RESET_CONFIRM/);
    expect(() => assertOwnerCredentialResetEnv({
      AUTH_OWNER_RESET_CONFIRM: "rotate-owner-auth",
      AUTH_OWNER_USER_ID: "e8f3e35b-6051-4da3-8b10-979700c2f00f",
      AUTH_OWNER_USERNAME: "owner@taqfeelah.com",
      AUTH_OWNER_PASSWORD: "secret",
    })).not.toThrow();
  });
});
