import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ComponentType } from "react";
import {
  APP_OPEN_SPLASH_FADE_MS,
  APP_OPEN_SPLASH_MAX_MS,
  APP_OPEN_SPLASH_MIN_MS,
  APP_OPEN_SPLASH_SESSION_KEY,
  buildAppOpenSplashDismissPlan,
  resolveAppOpenSplashWaitMs,
  resolveInitialSplashPhase,
  scheduleAppOpenSplashDismissal,
  scheduleAppOpenSplashDismissalWithPlan,
} from "./app-open-splash";
import {
  APP_RUNTIME_LOAD_MAX_ATTEMPTS,
  APP_RUNTIME_LOAD_RETRY_MS,
  loadTaqfeelahPrototypeRuntime,
} from "./load-taqfeelah-prototype-runtime";

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

describe("scheduleAppOpenSplashDismissal", () => {
  const storage = new Map<string, string>();

  beforeEach(() => {
    vi.useFakeTimers();
    storage.clear();
    vi.stubGlobal("window", {});
    vi.stubGlobal("sessionStorage", {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => {
        storage.set(key, value);
      },
      removeItem: (key: string) => {
        storage.delete(key);
      },
      clear: () => {
        storage.clear();
      },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("fades then hides after the minimum display time", () => {
    const onFade = vi.fn();
    const onHidden = vi.fn();

    scheduleAppOpenSplashDismissal(0, { onFade, onHidden });

    expect(onFade).not.toHaveBeenCalled();
    expect(onHidden).not.toHaveBeenCalled();

    vi.advanceTimersByTime(APP_OPEN_SPLASH_MIN_MS);
    expect(onFade).toHaveBeenCalledTimes(1);
    expect(onHidden).not.toHaveBeenCalled();

    vi.advanceTimersByTime(APP_OPEN_SPLASH_FADE_MS);
    expect(onHidden).toHaveBeenCalledTimes(1);
    expect(sessionStorage.getItem(APP_OPEN_SPLASH_SESSION_KEY)).toBe("1");
  });

  it("forces hide at the max ceiling when fade has not started yet", () => {
    const onFade = vi.fn();
    const onHidden = vi.fn();

    scheduleAppOpenSplashDismissalWithPlan(
      { waitMs: 5_000, fadeMs: 2_000, maxMs: 1_000 },
      { onFade, onHidden },
    );

    vi.advanceTimersByTime(1_000);

    expect(onFade).not.toHaveBeenCalled();
    expect(onHidden).toHaveBeenCalledTimes(1);
    expect(sessionStorage.getItem(APP_OPEN_SPLASH_SESSION_KEY)).toBe("1");
  });

  it("cancels pending timers when disposed", () => {
    const onFade = vi.fn();
    const onHidden = vi.fn();

    const dispose = scheduleAppOpenSplashDismissal(0, { onFade, onHidden });
    dispose();

    vi.advanceTimersByTime(APP_OPEN_SPLASH_MAX_MS);

    expect(onFade).not.toHaveBeenCalled();
    expect(onHidden).not.toHaveBeenCalled();
    expect(sessionStorage.getItem(APP_OPEN_SPLASH_SESSION_KEY)).toBeNull();
  });
});

describe("loadTaqfeelahPrototypeRuntime", () => {
  it("retries transient import failures before succeeding", async () => {
    const RuntimeStub = (() => null) as ComponentType;
    const importRuntime = vi
      .fn<() => Promise<{ default: ComponentType | undefined }>>()
      .mockRejectedValueOnce(new Error("chunk-failed"))
      .mockResolvedValueOnce({ default: RuntimeStub });

    const wait = vi.fn(async () => {});

    const runtime = await loadTaqfeelahPrototypeRuntime({
      importRuntime,
      maxAttempts: APP_RUNTIME_LOAD_MAX_ATTEMPTS,
      retryDelayMs: APP_RUNTIME_LOAD_RETRY_MS,
      wait,
    });

    expect(runtime).toBeTypeOf("function");
    expect(importRuntime).toHaveBeenCalledTimes(2);
    expect(wait).toHaveBeenCalledTimes(1);
    expect(wait).toHaveBeenCalledWith(APP_RUNTIME_LOAD_RETRY_MS);
  });

  it("throws after exhausting all attempts", async () => {
    const importRuntime = vi
      .fn<() => Promise<{ default: ComponentType | undefined }>>()
      .mockRejectedValue(new Error("chunk-failed"));
    const wait = vi.fn(async () => {});

    await expect(
      loadTaqfeelahPrototypeRuntime({
        importRuntime,
        maxAttempts: 2,
        retryDelayMs: 10,
        wait,
      }),
    ).rejects.toThrow("chunk-failed");

    expect(importRuntime).toHaveBeenCalledTimes(2);
    expect(wait).toHaveBeenCalledTimes(1);
  });
});
