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

export type AppOpenSplashDismissCallbacks = {
  onFade: () => void;
  onHidden: () => void;
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

/**
 * Schedules splash fade + hide on timers independent of runtime loading.
 * Returns a dispose function that cancels all pending timers.
 */
export function scheduleAppOpenSplashDismissalWithPlan(
  plan: AppOpenSplashDismissPlan,
  callbacks: AppOpenSplashDismissCallbacks,
): () => void {
  const { waitMs, fadeMs, maxMs } = plan;
  let disposed = false;
  let hideTimer: ReturnType<typeof setTimeout> | undefined;

  const completeHidden = () => {
    if (disposed) return;
    disposed = true;
    markAppOpenSplashDone();
    callbacks.onHidden();
  };

  const fadeTimer = setTimeout(() => {
    if (disposed) return;
    callbacks.onFade();
    hideTimer = setTimeout(completeHidden, fadeMs);
  }, waitMs);

  const maxTimer = setTimeout(() => {
    if (disposed) return;
    disposed = true;
    clearTimeout(fadeTimer);
    if (hideTimer) clearTimeout(hideTimer);
    markAppOpenSplashDone();
    callbacks.onHidden();
  }, maxMs);

  return () => {
    disposed = true;
    clearTimeout(fadeTimer);
    if (hideTimer) clearTimeout(hideTimer);
    clearTimeout(maxTimer);
  };
}

export function scheduleAppOpenSplashDismissal(
  elapsedMs: number,
  callbacks: AppOpenSplashDismissCallbacks,
): () => void {
  return scheduleAppOpenSplashDismissalWithPlan(
    buildAppOpenSplashDismissPlan(elapsedMs),
    callbacks,
  );
}
