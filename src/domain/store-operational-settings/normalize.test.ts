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
      closeoutAlert: false,
      employeeHistoryVisibility: "month",
    });
  });

  it("merges partial patches without dropping existing fields", () => {
    const merged = mergeStoreOperationalSettings(
      { closeoutAlert: false, employeeHistoryVisibility: "month" },
      { closeoutAlert: true },
    );
    expect(merged.closeoutAlert).toBe(true);
    expect(merged.employeeHistoryVisibility).toBe("month");
  });

  it("builds a minimal patch with only changed operational settings fields", () => {
    expect(diffStoreOperationalSettingsPatch(
      { closeoutAlert: false, employeeHistoryVisibility: "month" },
      { closeoutAlert: true, employeeHistoryVisibility: "month" },
    )).toEqual({ closeoutAlert: true });
  });

  it("falls back to defaults for invalid stored payloads", () => {
    expect(normalizeStoreOperationalSettings({ employeeHistoryVisibility: "invalid" })).toMatchObject({
      closeoutAlert: false,
      employeeHistoryVisibility: "month",
    });
  });

  it("strips removed legacy review fields from stored payloads", () => {
    const normalized = normalizeStoreOperationalSettings({
      reviewEnabled: true,
      closeoutReviewEnabled: true,
      attachmentAlert: true,
      closeoutAlert: true,
      employeeHistoryVisibility: "week",
    });
    expect(normalized).toEqual({
      activeCategories: expect.any(Array),
      closeoutAlert: true,
      employeeHistoryVisibility: "week",
      notebookTheme: null,
    });
    expect(normalized).not.toHaveProperty("reviewEnabled");
    expect(normalized).not.toHaveProperty("closeoutReviewEnabled");
    expect(normalized).not.toHaveProperty("attachmentAlert");
  });
});
