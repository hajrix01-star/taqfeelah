import { describe, expect, it } from "vitest";
import { shouldResetOwnerShellScroll } from "./owner-shell-scroll-reset";

describe("shouldResetOwnerShellScroll", () => {
  it("returns true when owner page changes", () => {
    expect(shouldResetOwnerShellScroll(
      { ownerPage: "register", employeePage: "closeouts" },
      { ownerPage: "home", employeePage: "closeouts" },
    )).toBe(true);
  });

  it("returns true when employee page changes", () => {
    expect(shouldResetOwnerShellScroll(
      { ownerPage: "home", employeePage: "closeouts" },
      { ownerPage: "home", employeePage: "settings" },
    )).toBe(true);
  });

  it("returns false when pages are unchanged", () => {
    expect(shouldResetOwnerShellScroll(
      { ownerPage: "register", employeePage: "closeouts" },
      { ownerPage: "register", employeePage: "closeouts" },
    )).toBe(false);
  });
});
