import { describe, expect, it } from "vitest";
import { isNotebookAppearanceDirty, isNotebookThemeDirty } from "./owner-settings-appearance-actions";

describe("owner settings appearance actions", () => {
  it("detects notebook theme draft changes", () => {
    expect(isNotebookThemeDirty("yellow", "ivory")).toBe(true);
    expect(isNotebookThemeDirty("yellow", "yellow")).toBe(false);
  });

  it("detects notebook paper pattern draft changes", () => {
    expect(isNotebookAppearanceDirty({
      draftTheme: "yellow",
      currentTheme: "yellow",
      draftPattern: "grid",
      currentPattern: "lined",
    })).toBe(true);
    expect(isNotebookAppearanceDirty({
      draftTheme: "yellow",
      currentTheme: "yellow",
      draftPattern: "lined",
      currentPattern: "lined",
    })).toBe(false);
  });
});
