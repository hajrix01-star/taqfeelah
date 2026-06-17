import { describe, expect, it } from "vitest";
import {
  APP_OPEN_SPLASH_FADE_MS,
  APP_OPEN_SPLASH_MAX_MS,
  APP_OPEN_SPLASH_MIN_MS,
  buildAppOpenSplashDismissPlan,
  resolveAppOpenSplashWaitMs,
  resolveInitialSplashPhase,
} from "./app-open-splash";

describe("app open splash timing", () => {
  it("exposes minimum display, fade, and max durations", () => {
    expect(APP_OPEN_SPLASH_MIN_MS).toBe(600);
    expect(APP_OPEN_SPLASH_FADE_MS).toBe(180);
    expect(APP_OPEN_SPLASH_MAX_MS).toBe(8000);
  });

  it("waits only until the minimum display time is met", () => {
    expect(resolveAppOpenSplashWaitMs(0)).toBe(600);
    expect(resolveAppOpenSplashWaitMs(250)).toBe(350);
    expect(resolveAppOpenSplashWaitMs(600)).toBe(0);
    expect(resolveAppOpenSplashWaitMs(1200)).toBe(0);
  });

  it("builds a dismiss plan from elapsed time", () => {
    expect(buildAppOpenSplashDismissPlan(0)).toEqual({
      waitMs: 600,
      fadeMs: 180,
      maxMs: 8000,
    });
    expect(buildAppOpenSplashDismissPlan(500)).toEqual({
      waitMs: 100,
      fadeMs: 180,
      maxMs: 8000,
    });
  });

  it("resolves the initial splash phase from session gate", () => {
    expect(resolveInitialSplashPhase(true)).toBe("visible");
    expect(resolveInitialSplashPhase(false)).toBe("hidden");
  });
});
