import { describe, expect, it, vi } from "vitest";
import { readDemoLastCloseoutDates } from "./owner-settings-storage";

describe("owner settings storage", () => {
  it("does not read demo last closeout dates when demo defaults are skipped", () => {
    const getItem = vi.fn(() => JSON.stringify({ shami: "2026-06-10" }));
    vi.stubGlobal("window", {
      localStorage: { getItem },
    });

    expect(readDemoLastCloseoutDates(true)).toEqual({});
    expect(getItem).not.toHaveBeenCalled();

    vi.unstubAllGlobals();
  });
});
