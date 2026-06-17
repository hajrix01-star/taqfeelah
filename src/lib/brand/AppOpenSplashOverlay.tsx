"use client";

import { AppBrandMark } from "@/lib/brand/AppBrandMark";
import { APP_OPEN_SPLASH_FADE_MS, type AppOpenSplashPhase } from "@/lib/brand/app-open-splash";

export type { AppOpenSplashPhase };

type AppOpenSplashOverlayProps = {
  phase: AppOpenSplashPhase;
};

export function AppOpenSplashOverlay({ phase }: AppOpenSplashOverlayProps) {
  if (phase === "hidden") return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#F8F6F0] px-6 transition-opacity ease-out ${
        phase === "fading" ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
      dir="rtl"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
        transitionDuration: `${APP_OPEN_SPLASH_FADE_MS}ms`,
      }}
      aria-hidden="true"
    >
      <AppBrandMark showTagline />
    </div>
  );
}
