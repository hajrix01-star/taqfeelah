import { describe, expect, it } from "vitest";
import {
  cloneStoreOperationalDraft,
  mergeOperationalDraft,
  toggleOperationalCategory,
} from "./owner-settings-operational-actions";

const baseConfig = {
  activeCategories: ["rent", "salary"],
  reviewEnabled: true,
};

describe("owner settings operational actions", () => {
  it("clones operational draft without shared category list", () => {
    const draft = cloneStoreOperationalDraft(baseConfig);
    draft.activeCategories.push("utility");

    expect(baseConfig.activeCategories).toEqual(["rent", "salary"]);
  });

  it("blocks disabling the last active category", () => {
    const single = { activeCategories: ["rent"] };
    expect(toggleOperationalCategory(single, "rent").blocked).toBe(true);
  });

  it("toggles categories and merges draft updates", () => {
    const toggled = toggleOperationalCategory(baseConfig, "salary");
    expect(toggled.blocked).toBe(false);
    expect(toggled.config.activeCategories).toEqual(["rent"]);

    const merged = mergeOperationalDraft(baseConfig, { reviewEnabled: false, closeoutAlert: true }) as {
      activeCategories: string[];
      reviewEnabled: boolean;
      closeoutAlert: boolean;
    };
    expect(merged.reviewEnabled).toBe(false);
    expect(merged.closeoutAlert).toBe(true);
    expect(merged.activeCategories).toEqual(["rent", "salary"]);
  });
});
