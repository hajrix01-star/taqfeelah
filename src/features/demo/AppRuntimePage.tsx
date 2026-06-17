"use client";

import ErrorBoundary from "@/components/ErrorBoundary";
import PrototypeClientGate from "@/features/demo/PrototypeClientGate";
import { AppBootSplashScreen } from "@/lib/brand/AppBootSplashScreen";
import { AppRuntimeLoadErrorScreen } from "@/lib/brand/AppRuntimeLoadErrorScreen";
import { useAppBootGate } from "@/lib/brand/use-app-boot-gate";
import { useTaqfeelahPrototypeRuntime } from "@/lib/brand/use-taqfeelah-prototype-runtime";

export default function AppRuntimePage() {
  const { showBootSplash, dismissBootSplash } = useAppBootGate();
  const { Runtime, loadError, retryLoad } = useTaqfeelahPrototypeRuntime();

  const runtimeContent = Runtime ? (
    <Runtime />
  ) : loadError ? (
    <AppRuntimeLoadErrorScreen onSoftRetry={retryLoad} />
  ) : null;

  return (
    <>
      <ErrorBoundary>
        <PrototypeClientGate>{runtimeContent}</PrototypeClientGate>
      </ErrorBoundary>
      {showBootSplash ? <AppBootSplashScreen onDone={dismissBootSplash} /> : null}
    </>
  );
}
