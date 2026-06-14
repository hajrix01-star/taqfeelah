import { afterEach, describe, expect, it, vi } from "vitest";
import { isFlattenedStoreSettingsEnabled } from "./owner-settings-store-layout-mode";

describe("owner settings store layout mode", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("enables flattened layout by default for the trial", () => {
    vi.stubEnv("NEXT_PUBLIC_OWNER_SETTINGS_FLATTENED_STORE", "");
    expect(isFlattenedStoreSettingsEnabled()).toBe(true);
  });

  it("falls back to legacy drill-down when explicitly disabled", () => {
    vi.stubEnv("NEXT_PUBLIC_OWNER_SETTINGS_FLATTENED_STORE", "false");
    expect(isFlattenedStoreSettingsEnabled()).toBe(false);
  });
});
