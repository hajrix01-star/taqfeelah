import { describe, expect, it, beforeEach } from "vitest";
import {
  clearOrganizationEntitlementsCache,
  readOrganizationEntitlementsCache,
  writeOrganizationEntitlementsCache,
} from "./organization-entitlements-cache";

describe("organization-entitlements-cache", () => {
  beforeEach(() => {
    clearOrganizationEntitlementsCache();
  });

  it("stores and reads entitlements by auth key", () => {
    writeOrganizationEntitlementsCache("org|user|owner", {
      entitlements: { planDisplayNameAr: "أساسي" },
      error: "",
    });

    expect(readOrganizationEntitlementsCache("org|user|owner")).toEqual({
      entitlements: { planDisplayNameAr: "أساسي" },
      error: "",
    });
    expect(readOrganizationEntitlementsCache("other")).toBeNull();
  });

  it("clears one key or all keys", () => {
    writeOrganizationEntitlementsCache("a", { entitlements: { id: 1 }, error: "" });
    writeOrganizationEntitlementsCache("b", { entitlements: { id: 2 }, error: "" });

    clearOrganizationEntitlementsCache("a");
    expect(readOrganizationEntitlementsCache("a")).toBeNull();
    expect(readOrganizationEntitlementsCache("b")).not.toBeNull();

    clearOrganizationEntitlementsCache();
    expect(readOrganizationEntitlementsCache("b")).toBeNull();
  });
});
