import { describe, expect, it } from "vitest";
import { isRegisterIndexTabsEnabled } from "./register-dashboard-tabs-mode";

describe("isRegisterIndexTabsEnabled", () => {
  it("enables index tabs by default", () => {
    expect(isRegisterIndexTabsEnabled({})).toBe(true);
    expect(isRegisterIndexTabsEnabled({ NEXT_PUBLIC_REGISTER_INDEX_TABS: "" })).toBe(true);
  });

  it("disables index tabs when env is false (rollback)", () => {
    expect(isRegisterIndexTabsEnabled({ NEXT_PUBLIC_REGISTER_INDEX_TABS: "false" })).toBe(false);
  });
});
