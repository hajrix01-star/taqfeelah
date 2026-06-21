import { describe, expect, it, beforeEach } from "vitest";
import {
  clearOrganizationEntitlementsCache,
  readOrganizationEntitlementsCache,
  writeOrganizationEntitlementsCache,
} from "./organization-entitlements-cache";
import type { ResolvedOrganizationEntitlements } from "@/features/billing/types";

describe("organization-entitlements-cache", () => {
  beforeEach(() => {
    clearOrganizationEntitlementsCache();
  });

  it("stores and reads entitlements by auth key", () => {
    writeOrganizationEntitlementsCache("org|user|owner", {
      entitlements: { planDisplayNameAr: "أساسي" } as ResolvedOrganizationEntitlements,
      error: "",
    });

    expect(readOrganizationEntitlementsCache("org|user|owner")).toEqual({
      entitlements: { planDisplayNameAr: "أساسي" },
      error: "",
    });
    expect(readOrganizationEntitlementsCache("other")).toBeNull();
  });

  it("clears one key or all keys", () => {
    writeOrganizationEntitlementsCache("a", { entitlements: { planDisplayNameAr: "a" } as ResolvedOrganizationEntitlements, error: "" });
    writeOrganizationEntitlementsCache("b", { entitlements: { planDisplayNameAr: "b" } as ResolvedOrganizationEntitlements, error: "" });

    clearOrganizationEntitlementsCache("a");
    expect(readOrganizationEntitlementsCache("a")).toBeNull();
    expect(readOrganizationEntitlementsCache("b")).not.toBeNull();

    clearOrganizationEntitlementsCache();
    expect(readOrganizationEntitlementsCache("b")).toBeNull();
  });
});
