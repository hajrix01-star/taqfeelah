import { describe, expect, it } from "vitest";
import { cursorsMapFromRecord } from "./fetch-register-entries-page-bundle";

describe("fetch-register-entries-page-bundle helpers", () => {
  it("builds a cursor map from a plain record", () => {
    const map = cursorsMapFromRecord({ storeA: "cursor-1", storeB: "cursor-2" });
    expect(map.get("storeA")).toBe("cursor-1");
    expect(map.get("storeB")).toBe("cursor-2");
  });
});
