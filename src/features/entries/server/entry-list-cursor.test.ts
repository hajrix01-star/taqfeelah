import { describe, expect, it } from "vitest";
import { decodeEntryListCursor, encodeEntryListCursor } from "./entry-list-cursor";

describe("entry list cursor", () => {
  it("round-trips cursor payload", () => {
    const encoded = encodeEntryListCursor({
      date: "2026-06-05",
      createdAt: "2026-06-05T10:15:30.000Z",
      id: "302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c",
    });

    expect(decodeEntryListCursor(encoded)).toEqual({
      date: "2026-06-05",
      createdAt: "2026-06-05T10:15:30.000Z",
      id: "302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c",
    });
  });

  it("rejects invalid cursor", () => {
    expect(() => decodeEntryListCursor("not-valid")).toThrow("Invalid entries cursor.");
  });
});
