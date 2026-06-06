import { describe, expect, it } from "vitest";
import {
  defaultStoreOperationalSettings,
  diffStoreOperationalSettingsPatch,
  mergeStoreOperationalSettings,
  normalizeStoreOperationalSettings,
} from "./normalize";

describe("normalizeStoreOperationalSettings", () => {
  it("returns product defaults for empty input", () => {
    expect(defaultStoreOperationalSettings()).toMatchObject({
      reviewEnabled: false,
      closeoutReviewEnabled: false,
      employeeHistoryVisibility: "all",
    });
  });

  it("merges partial patches without dropping existing fields", () => {
    const merged = mergeStoreOperationalSettings(
      { reviewEnabled: true, closeoutReviewEnabled: false },
      { closeoutReviewEnabled: true },
    );
    expect(merged.reviewEnabled).toBe(true);
    expect(merged.closeoutReviewEnabled).toBe(true);
  });

  it("builds a minimal patch with only changed operational settings fields", () => {
    expect(diffStoreOperationalSettingsPatch(
      { reviewEnabled: false, closeoutReviewEnabled: false },
      { reviewEnabled: false, closeoutReviewEnabled: true },
    )).toEqual({ closeoutReviewEnabled: true });
  });

  it("falls back to defaults for invalid stored payloads", () => {
    expect(normalizeStoreOperationalSettings({ employeeHistoryVisibility: "invalid" })).toMatchObject({
      closeoutReviewEnabled: false,
      employeeHistoryVisibility: "all",
    });
  });
});
