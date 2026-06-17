export type AppOpenSplashPhase = "visible" | "fading" | "hidden";

export const APP_OPEN_SPLASH_MIN_MS = 600;
export const APP_OPEN_SPLASH_FADE_MS = 180;
/** Absolute ceiling so a splash never blocks the app indefinitely. */
export const APP_OPEN_SPLASH_MAX_MS = 8_000;
export const APP_OPEN_SPLASH_SESSION_KEY = "taqfeelah_app_open_splash_done";

export type AppOpenSplashDismissPlan = {
  waitMs: number;
  fadeMs: number;
  maxMs: number;
};

export function shouldShowAppOpenSplash(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return !sessionStorage.getItem(APP_OPEN_SPLASH_SESSION_KEY);
  } catch {
    return true;
  }
}

export function markAppOpenSplashDone(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(APP_OPEN_SPLASH_SESSION_KEY, "1");
  } catch {
    // ignore storage failures
  }
}

export function resolveInitialSplashPhase(
  shouldShow: boolean = shouldShowAppOpenSplash(),
): AppOpenSplashPhase {
  return shouldShow ? "visible" : "hidden";
}

export function resolveAppOpenSplashWaitMs(elapsedMs: number): number {
  return Math.max(0, APP_OPEN_SPLASH_MIN_MS - elapsedMs);
}

export function buildAppOpenSplashDismissPlan(elapsedMs: number): AppOpenSplashDismissPlan {
  return {
    waitMs: resolveAppOpenSplashWaitMs(elapsedMs),
    fadeMs: APP_OPEN_SPLASH_FADE_MS,
    maxMs: APP_OPEN_SPLASH_MAX_MS,
  };
}
