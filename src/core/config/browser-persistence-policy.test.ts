import { afterEach, describe, expect, it, vi } from "vitest";
import {
  browserPersistenceBlockedReason,
  isBrowserPersistentStorageAllowed,
} from "./browser-persistence-policy";

describe("browser persistence policy", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("allows browser persistence for local mode", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_MODE", "local");
    vi.stubEnv("NEXT_PUBLIC_DISABLE_BROWSER_PERSISTENCE", "false");

    expect(isBrowserPersistentStorageAllowed({ scope: "local-runtime" })).toBe(true);
    expect(browserPersistenceBlockedReason({ scope: "local-runtime" })).toBeNull();
  });

  it("blocks browser persistence in production app mode", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_MODE", "production");

    expect(isBrowserPersistentStorageAllowed({ scope: "ui-preferences" })).toBe(false);
    expect(browserPersistenceBlockedReason({ scope: "ui-preferences" })).toBe("production-app-mode");
  });

  it("can be disabled explicitly outside production", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_MODE", "local");
    vi.stubEnv("NEXT_PUBLIC_DISABLE_BROWSER_PERSISTENCE", "true");

    expect(isBrowserPersistentStorageAllowed({ scope: "legacy-settings" })).toBe(false);
    expect(browserPersistenceBlockedReason({ scope: "legacy-settings" })).toBe("disabled-by-env");
  });
});
