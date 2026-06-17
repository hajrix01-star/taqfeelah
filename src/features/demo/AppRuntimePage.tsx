"use client";

import { useEffect, useRef, useState, type ComponentType } from "react";
import ErrorBoundary from "@/components/ErrorBoundary";
import PrototypeClientGate from "@/features/demo/PrototypeClientGate";
import { AppOpenSplashOverlay } from "@/lib/brand/AppOpenSplashOverlay";
import {
  buildAppOpenSplashDismissPlan,
  markAppOpenSplashDone,
  resolveInitialSplashPhase,
  shouldShowAppOpenSplash,
  type AppOpenSplashPhase,
} from "@/lib/brand/app-open-splash";

function RuntimeLoadErrorScreen({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 bg-[#F8F6F0] px-6 text-center"
      dir="rtl"
      style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <p className="text-sm font-black text-[#B44747]">تعذّر تحميل التطبيق</p>
      <p className="text-xs font-bold leading-6 text-[#827762]">
        تحقق من الاتصال ثم أعد المحاولة. إن استمر الخطأ، امسح بيانات الموقع وأعد فتح التطبيق.
      </p>
      <button
        type="button"
        className="rounded-2xl bg-[#112A46] px-5 py-3 text-xs font-black text-white"
        onClick={onRetry}
      >
        إعادة المحاولة
      </button>
    </div>
  );
}

export default function AppRuntimePage() {
  const [Runtime, setRuntime] = useState<ComponentType | null>(null);
  const [runtimeLoadError, setRuntimeLoadError] = useState(false);
  const [splashPhase, setSplashPhase] = useState<AppOpenSplashPhase>(resolveInitialSplashPhase);
  const splashStartedAtRef = useRef(Date.now());

  useEffect(() => {
    if (!shouldShowAppOpenSplash()) {
      setSplashPhase("hidden");
      return undefined;
    }

    let cancelled = false;
    let hideTimer: ReturnType<typeof setTimeout> | undefined;
    const { waitMs, fadeMs, maxMs } = buildAppOpenSplashDismissPlan(
      Date.now() - splashStartedAtRef.current,
    );

    const finishSplash = () => {
      if (cancelled) return;
      markAppOpenSplashDone();
      setSplashPhase("hidden");
    };

    const fadeTimer = setTimeout(() => {
      if (cancelled) return;
      setSplashPhase("fading");
      hideTimer = setTimeout(finishSplash, fadeMs);
    }, waitMs);

    const maxTimer = setTimeout(finishSplash, maxMs);

    return () => {
      cancelled = true;
      clearTimeout(fadeTimer);
      if (hideTimer) clearTimeout(hideTimer);
      clearTimeout(maxTimer);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    void import("@/components/TaqfeelahPrototypeRuntime")
      .then((mod) => {
        if (cancelled) return;
        if (!mod.default) {
          setRuntimeLoadError(true);
          return;
        }
        setRuntimeLoadError(false);
        setRuntime(() => mod.default);
      })
      .catch(() => {
        if (cancelled) return;
        setRuntimeLoadError(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const runtimeContent = Runtime ? (
    <Runtime />
  ) : runtimeLoadError ? (
    <RuntimeLoadErrorScreen onRetry={() => window.location.reload()} />
  ) : null;

  return (
    <>
      <ErrorBoundary>
        <PrototypeClientGate>{runtimeContent}</PrototypeClientGate>
      </ErrorBoundary>
      <AppOpenSplashOverlay phase={splashPhase} />
    </>
  );
}
