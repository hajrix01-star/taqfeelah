import { describe, expect, it } from "vitest";
import { notebookLinesBackground } from "@/features/daily-closeouts/notebook-themes";
import { resolvePullToRefreshSurfaceStyle } from "./pull-to-refresh-surface";

describe("resolvePullToRefreshSurfaceStyle", () => {
  it("returns notebook paper background for notebook pages", () => {
    expect(resolvePullToRefreshSurfaceStyle(true, "yellow")).toEqual(
      notebookLinesBackground("yellow"),
    );
  });

  it("returns shell background for non-notebook pages", () => {
    expect(resolvePullToRefreshSurfaceStyle(false, "yellow")).toEqual({
      backgroundColor: "#F8F6F0",
    });
  });
});
