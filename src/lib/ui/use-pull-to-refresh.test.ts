import { describe, expect, it } from "vitest";
import {
  PULL_TO_REFRESH_MAX_DISTANCE,
  PULL_TO_REFRESH_THRESHOLD,
  resolvePullToRefreshDistance,
} from "./use-pull-to-refresh";

describe("resolvePullToRefreshDistance", () => {
  it("returns zero for non-positive deltas", () => {
    expect(resolvePullToRefreshDistance(0)).toBe(0);
    expect(resolvePullToRefreshDistance(-12)).toBe(0);
  });

  it("grows with rubber-band resistance and caps at max distance", () => {
    const mid = resolvePullToRefreshDistance(80);
    const high = resolvePullToRefreshDistance(320);

    expect(mid).toBeGreaterThan(0);
    expect(mid).toBeLessThan(80);
    expect(high).toBe(PULL_TO_REFRESH_MAX_DISTANCE);
  });

  it("reaches refresh threshold within a natural pull distance", () => {
    let delta = 1;
    while (delta < 400 && resolvePullToRefreshDistance(delta) < PULL_TO_REFRESH_THRESHOLD) {
      delta += 1;
    }
    expect(delta).toBeGreaterThan(80);
    expect(delta).toBeLessThan(180);
  });
});
