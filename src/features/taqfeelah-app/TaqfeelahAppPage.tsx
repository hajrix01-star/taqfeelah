"use client";

import ErrorBoundary from "@/components/ErrorBoundary";
import TaqfeelahAppClientGate from "@/features/taqfeelah-app/TaqfeelahAppClientGate";
import { AppRuntimeLoadErrorScreen } from "@/lib/brand/AppRuntimeLoadErrorScreen";
import { useTaqfeelahAppRuntime } from "@/lib/brand/use-taqfeelah-app-runtime";

export default function TaqfeelahAppPage() {
  const { Runtime, loadError, retryLoad } = useTaqfeelahAppRuntime();

  const runtimeContent = Runtime ? (
    <Runtime />
  ) : loadError ? (
    <AppRuntimeLoadErrorScreen onSoftRetry={retryLoad} />
  ) : null;

  return (
    <ErrorBoundary>
      <TaqfeelahAppClientGate>{runtimeContent}</TaqfeelahAppClientGate>
    </ErrorBoundary>
  );
}
