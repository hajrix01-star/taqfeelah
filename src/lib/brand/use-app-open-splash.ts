"use client";

import { useEffect, useRef, useState } from "react";
import {
  resolveInitialSplashPhase,
  scheduleAppOpenSplashDismissal,
  shouldShowAppOpenSplash,
  type AppOpenSplashPhase,
} from "@/lib/brand/app-open-splash";

export function useAppOpenSplash(): AppOpenSplashPhase {
  const [phase, setPhase] = useState<AppOpenSplashPhase>(resolveInitialSplashPhase);
  const startedAtRef = useRef(Date.now());

  useEffect(() => {
    if (!shouldShowAppOpenSplash()) {
      setPhase("hidden");
      return undefined;
    }

    return scheduleAppOpenSplashDismissal(Date.now() - startedAtRef.current, {
      onFade: () => setPhase("fading"),
      onHidden: () => setPhase("hidden"),
    });
  }, []);

  return phase;
}
