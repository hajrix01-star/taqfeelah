import { describe, expect, it } from "vitest";
import {
  filterOwnerDuplicateWatchEntries,
  resolveOwnerDuplicateWatchWindow,
} from "./owner-duplicate-watch";

describe("owner duplicate watch", () => {
  it("keeps active summary entries only", () => {
    const filtered = filterOwnerDuplicateWatchEntries([
      { id: "1", type: "summary", status: "active" },
      { id: "2", type: "expense", status: "active" },
      { id: "3", type: "summary", status: "voided" },
    ]);
    expect(filtered.map((entry) => entry.id)).toEqual(["1"]);
  });

  it("uses a short rolling window", () => {
    const window = resolveOwnerDuplicateWatchWindow("2026-06-10");
    expect(window.dateTo).toBe("2026-06-10");
    expect(window.dateFrom).toBe("2026-05-27");
    expect(window.limit).toBe(120);
  });
});
