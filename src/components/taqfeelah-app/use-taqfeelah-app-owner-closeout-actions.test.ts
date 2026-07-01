import { describe, expect, it } from "vitest";
import {
  shouldOpenOwnerCloseoutEntryForQuickAdd,
  shouldOpenOwnerCloseoutEntryForQuickExpense,
} from "./use-taqfeelah-app-owner-closeout-actions";

describe("owner closeout quick actions", () => {
  it("opens the unified closeout entry directly from owner quick add in DB source mode", () => {
    expect(shouldOpenOwnerCloseoutEntryForQuickAdd({ entriesApiDbSource: true })).toBe(true);
  });

  it("keeps the legacy quick add sheet only outside DB source mode", () => {
    expect(shouldOpenOwnerCloseoutEntryForQuickAdd({ entriesApiDbSource: false })).toBe(false);
  });

  it("routes owner quick outflow through the full closeout entry in DB source mode", () => {
    expect(shouldOpenOwnerCloseoutEntryForQuickExpense({ entriesApiDbSource: true })).toBe(true);
  });

  it("keeps the legacy quick expense screen only outside DB source mode", () => {
    expect(shouldOpenOwnerCloseoutEntryForQuickExpense({ entriesApiDbSource: false })).toBe(false);
  });
});
