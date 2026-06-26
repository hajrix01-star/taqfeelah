import { describe, expect, it, vi } from "vitest";
import { readLocalLastCloseoutDates } from "./owner-settings-storage";

describe("owner settings storage", () => {
  it("does not read local last closeout dates when local defaults are skipped", () => {
    const getItem = vi.fn(() => JSON.stringify({ shami: "2026-06-10" }));
    vi.stubGlobal("window", {
      localStorage: { getItem },
    });

    expect(readLocalLastCloseoutDates(true)).toEqual({});
    expect(getItem).not.toHaveBeenCalled();

    vi.unstubAllGlobals();
  });
});
