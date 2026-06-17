"use client";

import ErrorBoundary from "@/components/ErrorBoundary";
import PrototypeClientGate from "@/features/demo/PrototypeClientGate";
import { AppOpenSplashOverlay } from "@/lib/brand/AppOpenSplashOverlay";
import { AppRuntimeLoadErrorScreen } from "@/lib/brand/AppRuntimeLoadErrorScreen";
import { useAppOpenSplash } from "@/lib/brand/use-app-open-splash";
import { useTaqfeelahPrototypeRuntime } from "@/lib/brand/use-taqfeelah-prototype-runtime";

export default function AppRuntimePage() {
  const splashPhase = useAppOpenSplash();
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
      <AppOpenSplashOverlay phase={splashPhase} />
    </>
  );
}
