import { describe, expect, it } from "vitest";
import {
  APP_OPEN_SPLASH_FADE_MS,
  APP_OPEN_SPLASH_MIN_MS,
  resolveAppOpenSplashWaitMs,
} from "./app-open-splash";

describe("app open splash timing", () => {
  it("exposes minimum display and fade durations", () => {
    expect(APP_OPEN_SPLASH_MIN_MS).toBe(600);
    expect(APP_OPEN_SPLASH_FADE_MS).toBe(180);
  });

  it("waits only until the minimum display time is met", () => {
    expect(resolveAppOpenSplashWaitMs(0)).toBe(600);
    expect(resolveAppOpenSplashWaitMs(250)).toBe(350);
    expect(resolveAppOpenSplashWaitMs(600)).toBe(0);
    expect(resolveAppOpenSplashWaitMs(1200)).toBe(0);
  });
});
