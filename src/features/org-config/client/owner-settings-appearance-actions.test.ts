import { describe, expect, it } from "vitest";
import { isNotebookThemeDirty } from "./owner-settings-appearance-actions";

describe("owner settings appearance actions", () => {
  it("detects notebook theme draft changes", () => {
    expect(isNotebookThemeDirty("yellow", "ivory")).toBe(true);
    expect(isNotebookThemeDirty("yellow", "yellow")).toBe(false);
  });
});
