import { describe, expect, it } from "vitest";
import { resolveCloseoutStoreName, resolveEmployeeStoreName } from "./store-name-resolver";

describe("store name resolver", () => {
  it("uses displayName as top-priority source", () => {
    const result = resolveEmployeeStoreName(
      { id: "shami", displayName: "المعلم الشامي", nameAr: "", nameEn: "" },
      "ar",
    );
    expect(result).toBe("المعلم الشامي");
  });

  it("falls back to localized names when displayName is missing", () => {
    const result = resolveEmployeeStoreName(
      { id: "arz", nameAr: "لاونج أرز", nameEn: "ARZ Lounge" },
      "ar",
    );
    expect(result).toBe("لاونج أرز");
  });

  it("resolves closeout store name from current store when closeout value is empty", () => {
    const result = resolveCloseoutStoreName({
      preferredStoreName: "",
      closeout: { id: "c-1", storeName: "" },
      currentStore: { id: "shami", displayName: "المعلم الشامي" },
      lang: "ar",
    });
    expect(result).toBe("المعلم الشامي");
  });
});
