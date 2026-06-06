import { describe, expect, it } from "vitest";
import { resolveOutflowCategoryKey } from "./outflow-category-key";

describe("resolveOutflowCategoryKey", () => {
  it("maps purchases and withdrawal by type", () => {
    expect(resolveOutflowCategoryKey({ type: "purchases" })).toBe("purchases");
    expect(resolveOutflowCategoryKey({ type: "withdrawal" })).toBe("withdrawal");
  });

  it("maps known expense category ids", () => {
    expect(resolveOutflowCategoryKey({ type: "expense", categoryId: "rent" })).toBe("rent");
  });

  it("falls back to category name heuristics", () => {
    expect(resolveOutflowCategoryKey({
      type: "expense",
      categoryName: "إيجار المحل",
    })).toBe("rent");
  });

  it("defaults unknown expense categories to other", () => {
    expect(resolveOutflowCategoryKey({
      type: "expense",
      categoryName: "misc",
    })).toBe("other");
  });
});
