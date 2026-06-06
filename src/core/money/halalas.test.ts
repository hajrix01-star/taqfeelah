import { describe, expect, it } from "vitest";
import { formatOutflowRatio, toHalalas, toRiyals } from "./halalas";

describe("toHalalas / toRiyals", () => {
  it("round-trips whole riyal amounts", () => {
    expect(toHalalas(100)).toBe(10000);
    expect(toRiyals(10000)).toBe(100);
  });

  it("rounds fractional riyals to nearest halala", () => {
    expect(toHalalas(12.345)).toBe(1235);
    expect(toRiyals(1235)).toBe(12.35);
  });

  it("preserves zero", () => {
    expect(toHalalas(0)).toBe(0);
    expect(toRiyals(0)).toBe(0);
  });
});

describe("formatOutflowRatio", () => {
  it("formats calculable ratio with one decimal", () => {
    expect(formatOutflowRatio(17000, 3000)).toEqual({
      ratio: "17.6%",
      status: "calculable",
    });
  });

  it("returns not calculable when sales are zero and outflow exists", () => {
    expect(formatOutflowRatio(0, 1500)).toEqual({
      ratio: "—",
      status: "notCalculable",
    });
  });

  it("returns zero ratio when both are zero", () => {
    expect(formatOutflowRatio(0, 0)).toEqual({
      ratio: "0.0%",
      status: "calculable",
    });
  });
});
