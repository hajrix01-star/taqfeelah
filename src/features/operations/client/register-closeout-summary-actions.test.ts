import { describe, expect, it } from "vitest";
import {
  canManageRegisterCloseoutSummary,
  resolveCloseoutFromRegisterSummary,
} from "./register-closeout-summary-actions";

describe("register-closeout-summary-actions", () => {
  it("resolves closeout from summary id", () => {
    const closeout = resolveCloseoutFromRegisterSummary(
      { closeoutId: "c1" },
      [{ id: "c1", storeId: "s1" } as { id: string; storeId: string }],
    );
    expect(closeout?.id).toBe("c1");
  });

  it("blocks manage actions without closeout id or archived store", () => {
    expect(canManageRegisterCloseoutSummary({ closeoutId: null, businessId: "s1" })).toBe(false);
    expect(canManageRegisterCloseoutSummary({ closeoutId: "c1", businessId: "s1" }, ["s1"])).toBe(false);
    expect(canManageRegisterCloseoutSummary({ closeoutId: "c1", businessId: "s1" }, [])).toBe(true);
  });
});
