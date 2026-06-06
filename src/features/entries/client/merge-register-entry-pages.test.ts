import { describe, expect, it } from "vitest";
import { mergeRegisterEntryPages } from "./merge-register-entry-pages";

describe("mergeRegisterEntryPages", () => {
  it("dedupes and sorts newest first", () => {
    const merged = mergeRegisterEntryPages(
      [{ id: "a", date: "2026-06-05", createdAt: "2026-06-05T10:00:00Z" }],
      [
        { id: "a", date: "2026-06-05", createdAt: "2026-06-05T10:00:00Z" },
        { id: "b", date: "2026-06-06", createdAt: "2026-06-06T08:00:00Z" },
      ],
    );

    expect(merged.map((entry) => entry.id)).toEqual(["b", "a"]);
  });
});
