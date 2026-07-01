import { describe, expect, it } from "vitest";
import {
  buildInitialCloseoutSalesValues,
  closeoutHasAnyAmount,
  resolvePartialCloseoutWarning,
} from "./use-daily-closeout-entry-state";

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

describe("daily closeout entry amount rules", () => {
  it("allows saving when only incoming exists", () => {
    const totals = { totalSales: 150, totalOutflow: 0 };

    expect(closeoutHasAnyAmount(totals)).toBe(true);
    expect(resolvePartialCloseoutWarning("ar", totals)?.title).toBe("تم إدخال الداخل بدون الخارج");
  });

  it("allows saving when only outflow exists", () => {
    const totals = { totalSales: 0, totalOutflow: 75 };

    expect(closeoutHasAnyAmount(totals)).toBe(true);
    expect(resolvePartialCloseoutWarning("ar", totals)?.title).toBe("تم إدخال الخارج بدون الداخل");
  });

  it("does not warn when both incoming and outflow exist", () => {
    const totals = { totalSales: 150, totalOutflow: 75 };

    expect(closeoutHasAnyAmount(totals)).toBe(true);
    expect(resolvePartialCloseoutWarning("ar", totals)).toBeNull();
  });

  it("blocks empty closeouts", () => {
    const totals = { totalSales: 0, totalOutflow: 0 };

    expect(closeoutHasAnyAmount(totals)).toBe(false);
    expect(resolvePartialCloseoutWarning("ar", totals)).toBeNull();
  });
});
