import { describe, expect, it } from "vitest";
import { buildInitialCloseoutSalesValues } from "./use-daily-closeout-entry-state";

describe("buildInitialCloseoutSalesValues", () => {
  it("initializes empty string values for channels without sales rows", () => {
    const values = buildInitialCloseoutSalesValues(
      { id: "dc-1", sales: [] },
      [{ id: "cash" }, { id: "card" }],
      (channel) => channel.id,
    );
    expect(values).toEqual({ cash: "", card: "" });
  });

  it("hydrates amounts from closeout sales rows", () => {
    const values = buildInitialCloseoutSalesValues(
      { id: "dc-1", sales: [{ channelId: "cash", name: "نقد", amount: 50 }, { channelId: "card", amount: 120 }] },
      [{ id: "cash" }, { id: "card" }],
      (channel) => channel.id,
    );
    expect(values).toEqual({ cash: "50", card: "120" });
  });

  it("uses empty string for zero-amount channels (falsy amount guard)", () => {
    const values = buildInitialCloseoutSalesValues(
      { id: "dc-1", sales: [{ channelId: "cash", amount: 0 }] },
      [{ id: "cash" }],
      (channel) => channel.id,
    );
    expect(values).toEqual({ cash: "" });
  });
});
