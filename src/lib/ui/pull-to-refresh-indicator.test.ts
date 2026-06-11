import { describe, expect, it } from "vitest";
import {
  PTR_INDICATOR_CIRCUMFERENCE,
  resolvePullToRefreshArcOffset,
  resolvePullToRefreshIndicatorScale,
} from "./pull-to-refresh-indicator";

describe("resolvePullToRefreshIndicatorScale", () => {
  it("ramps scale with pull progress and locks at 1 while refreshing", () => {
    expect(resolvePullToRefreshIndicatorScale(0, false)).toBeCloseTo(0.35);
    expect(resolvePullToRefreshIndicatorScale(1, false)).toBeCloseTo(1);
    expect(resolvePullToRefreshIndicatorScale(0.2, false)).toBeCloseTo(0.48);
    expect(resolvePullToRefreshIndicatorScale(0, true)).toBe(1);
  });
});

describe("resolvePullToRefreshArcOffset", () => {
  it("reveals more arc as pull progresses", () => {
    const low = resolvePullToRefreshArcOffset(0.2, false);
    const high = resolvePullToRefreshArcOffset(0.9, false);

    expect(low).toBeGreaterThan(high);
    expect(high).toBeGreaterThan(0);
  });

  it("uses a spinner gap while refreshing", () => {
    expect(resolvePullToRefreshArcOffset(1, true)).toBeCloseTo(
      PTR_INDICATOR_CIRCUMFERENCE * 0.72,
    );
  });
});
