export const APP_OPEN_SPLASH_MIN_MS = 600;
export const APP_OPEN_SPLASH_FADE_MS = 180;
export const APP_OPEN_SPLASH_SESSION_KEY = "taqfeelah_app_open_splash_done";

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

export function resolveAppOpenSplashWaitMs(elapsedMs: number): number {
  return Math.max(0, APP_OPEN_SPLASH_MIN_MS - elapsedMs);
}
