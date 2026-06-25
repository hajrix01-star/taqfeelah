import { describe, expect, it } from "vitest";
import { shouldOpenOwnerCloseoutEntryForQuickExpense } from "./use-taqfeelah-app-owner-closeout-actions";

describe("owner closeout quick actions", () => {
  it("routes owner quick outflow through the full closeout entry in DB source mode", () => {
    expect(shouldOpenOwnerCloseoutEntryForQuickExpense({ entriesApiDbSource: true })).toBe(true);
  });

  it("keeps the legacy quick expense screen only outside DB source mode", () => {
    expect(shouldOpenOwnerCloseoutEntryForQuickExpense({ entriesApiDbSource: false })).toBe(false);
  });
});
