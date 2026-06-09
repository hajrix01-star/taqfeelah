import { describe, expect, it, vi } from "vitest";

vi.mock("@/core/config/entries-api-mode", () => ({
  isEntriesApiDbSourceMode: vi.fn(() => true),
}));

describe("closeout-linked entry filter", () => {
  it("excludes orphan rows in db source mode", async () => {
    const { includeListedEntryRow } = await import("./closeout-linked-entry-filter");

    const meta = new Map([["c1", { status: "approved" }]]);
    expect(includeListedEntryRow({ closeoutId: null }, meta)).toBe(false);
    expect(includeListedEntryRow({ closeoutId: "c1" }, meta)).toBe(true);
    expect(includeListedEntryRow({ closeoutId: "missing" }, meta)).toBe(false);
  });

  it("allows legacy orphan rows when db source mode is off", async () => {
    const { isEntriesApiDbSourceMode } = await import("@/core/config/entries-api-mode");
    vi.mocked(isEntriesApiDbSourceMode).mockReturnValueOnce(false);

    const { includeListedEntryRow } = await import("./closeout-linked-entry-filter");
    expect(includeListedEntryRow({ closeoutId: null }, new Map())).toBe(true);
  });
});
