import { describe, expect, it } from "vitest";
import {
  closeoutTotalsFromHalalas,
  closeoutTotalsFromRiyalRows,
} from "./closeout-summary-totals";

describe("closeoutTotalsFromHalalas", () => {
  it("maps halala totals through the domain engine", () => {
    expect(closeoutTotalsFromHalalas(10000, 2000)).toEqual({
      totalSales: 100,
      totalOutflow: 20,
      netMovement: 80,
      outflowRatio: "20.0%",
      outflowRatioStatus: "calculable",
    });
  });

  it("returns not calculable ratio when sales are zero", () => {
    expect(closeoutTotalsFromHalalas(0, 1500)).toMatchObject({
      totalSales: 0,
      totalOutflow: 15,
      netMovement: -15,
      outflowRatio: "—",
      outflowRatioStatus: "notCalculable",
    });
  });
});

describe("closeoutTotalsFromRiyalRows", () => {
  it("uses shared halala conversion instead of manual rounding", () => {
    expect(closeoutTotalsFromRiyalRows(
      [{ amount: 125 }, { amount: 45 }],
      [{ amount: 20 }, { amount: 10 }],
    )).toMatchObject({
      totalSales: 170,
      totalOutflow: 30,
      netMovement: 140,
      outflowRatio: "17.6%",
    });
  });
});
