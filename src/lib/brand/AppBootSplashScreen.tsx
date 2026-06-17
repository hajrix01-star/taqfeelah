"use client";

import { useEffect, useRef } from "react";
import { AppBrandMark } from "@/lib/brand/AppBrandMark";
import {
  APP_OPEN_SPLASH_FALLBACK_MS,
  APP_OPEN_SPLASH_TOTAL_MS,
} from "@/lib/brand/app-open-splash";

type AppBootSplashScreenProps = {
  onDone: () => void;
};

/**
 * Boot splash driven primarily by CSS animation so fade/hide still runs
 * when the main thread is busy loading the runtime chunk.
 */
export function AppBootSplashScreen({ onDone }: AppBootSplashScreenProps) {
  const doneRef = useRef(false);

  useEffect(() => {
    const finish = () => {
      if (doneRef.current) return;
      doneRef.current = true;
      onDone();
    };

    const fallbackTimer = window.setTimeout(finish, APP_OPEN_SPLASH_FALLBACK_MS);
    return () => window.clearTimeout(fallbackTimer);
  }, [onDone]);

  const handleAnimationEnd = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    onDone();
  };

  return (
    <div
      className="taq-app-boot-splash fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#F8F6F0] px-6"
      dir="rtl"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
        ["--taq-boot-splash-duration" as string]: `${APP_OPEN_SPLASH_TOTAL_MS}ms`,
      }}
      onAnimationEnd={handleAnimationEnd}
      aria-hidden="true"
    >
      <AppBrandMark showTagline />
    </div>
  );
}
