import { describe, expect, it } from "vitest";
import {
  decodeCloseoutListCursor,
  encodeCloseoutListCursor,
} from "./closeout-list-cursor";

describe("closeout list cursor", () => {
  it("round-trips closeout cursor payload", () => {
    const encoded = encodeCloseoutListCursor({
      date: "2026-06-05",
      createdAt: new Date("2026-06-05T12:00:00.000Z"),
      id: "11111111-1111-4111-8111-111111111111",
    });

    expect(decodeCloseoutListCursor(encoded)).toEqual({
      date: "2026-06-05",
      createdAt: "2026-06-05T12:00:00.000Z",
      id: "11111111-1111-4111-8111-111111111111",
    });
  });
});
