"use client";

import { useEffect, useRef, useState, type ComponentType } from "react";
import ErrorBoundary from "@/components/ErrorBoundary";
import PrototypeClientGate from "@/features/demo/PrototypeClientGate";
import { AppOpenSplashOverlay, type AppOpenSplashPhase } from "@/lib/brand/AppOpenSplashOverlay";
import {
  APP_OPEN_SPLASH_FADE_MS,
  markAppOpenSplashDone,
  resolveAppOpenSplashWaitMs,
  shouldShowAppOpenSplash,
} from "@/lib/brand/app-open-splash";

export default function AppRuntimePage() {
  const [Runtime, setRuntime] = useState<ComponentType | null>(null);
  const [splashPhase, setSplashPhase] = useState<AppOpenSplashPhase>(() => (
    shouldShowAppOpenSplash() ? "visible" : "hidden"
  ));
  const startedAtRef = useRef(Date.now());

  useEffect(() => {
    let cancelled = false;
    let fadeTimer: ReturnType<typeof setTimeout> | undefined;
    let hideTimer: ReturnType<typeof setTimeout> | undefined;

    void import("@/components/TaqfeelahPrototypeRuntime").then((mod) => {
      if (cancelled) return;
      setRuntime(() => mod.default);

      if (!shouldShowAppOpenSplash()) return;

      const waitMs = resolveAppOpenSplashWaitMs(Date.now() - startedAtRef.current);
      fadeTimer = setTimeout(() => {
        if (cancelled) return;
        setSplashPhase("fading");
        hideTimer = setTimeout(() => {
          if (cancelled) return;
          markAppOpenSplashDone();
          setSplashPhase("hidden");
        }, APP_OPEN_SPLASH_FADE_MS);
      }, waitMs);
    });

    return () => {
      cancelled = true;
      if (fadeTimer) clearTimeout(fadeTimer);
      if (hideTimer) clearTimeout(hideTimer);
    };
  }, []);

  return (
    <>
      <ErrorBoundary>
        <PrototypeClientGate>
          {Runtime ? <Runtime /> : null}
        </PrototypeClientGate>
      </ErrorBoundary>
      <AppOpenSplashOverlay phase={splashPhase} />
    </>
  );
}
