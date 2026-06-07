import { describe, expect, it } from "vitest";
import {
  isUuid,
  mapToUuid,
  reverseLookupKeyByUuid,
  toMoneyHalalas,
} from "./api-id-utils";

describe("api-id-utils", () => {
  it("detects UUID values", () => {
    expect(isUuid("e8f3e35b-6051-4da3-8b10-979700c2f00f")).toBe(true);
    expect(isUuid("owner")).toBe(false);
  });

  it("maps legacy ids through runtime maps", () => {
    const map = { owner: "e8f3e35b-6051-4da3-8b10-979700c2f00f" };
    expect(mapToUuid("owner", map)).toBe("e8f3e35b-6051-4da3-8b10-979700c2f00f");
    expect(mapToUuid("e8f3e35b-6051-4da3-8b10-979700c2f00f", map)).toBe(
      "e8f3e35b-6051-4da3-8b10-979700c2f00f",
    );
  });

  it("reverse-looks up legacy keys from UUIDs", () => {
    const map = { shami: "302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c" };
    expect(reverseLookupKeyByUuid("302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c", map)).toBe("shami");
  });

  it("converts riyal amounts to halalas", () => {
    expect(toMoneyHalalas(12.34)).toBe(1234);
  });
});
