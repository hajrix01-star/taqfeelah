import { describe, expect, it } from "vitest";
import {
  buildOwnerOutflowCloseoutDraft,
  isOwnerStandaloneOutflowPayload,
} from "./build-owner-outflow-closeout-draft";

describe("buildOwnerOutflowCloseoutDraft", () => {
  it("builds outflow-only closeout draft for owner expense payload", () => {
    const draft = buildOwnerOutflowCloseoutDraft({
      businessId: "shami",
      date: "2026-06-13",
      type: "expense",
      categoryId: "maintenance",
      amount: 80,
      note: "test",
    }, "ar");

    expect(draft).toMatchObject({
      storeId: "shami",
      date: "2026-06-13",
      sales: {},
    });
    expect(draft?.outflows).toHaveLength(1);
    expect(draft?.outflows?.[0]).toMatchObject({
      type: "expense",
      amount: 80,
      note: "test",
    });
  });

  it("returns null for invalid payload", () => {
    expect(buildOwnerOutflowCloseoutDraft({ type: "expense", amount: 0 }, "ar")).toBeNull();
  });
});

describe("isOwnerStandaloneOutflowPayload", () => {
  it("detects outflow entry types only", () => {
    expect(isOwnerStandaloneOutflowPayload({ type: "expense" })).toBe(true);
    expect(isOwnerStandaloneOutflowPayload({ type: "summary" })).toBe(false);
  });
});
