"use client";

import ErrorBoundary from "@/components/ErrorBoundary";
import PrototypeClientGate from "@/features/demo/PrototypeClientGate";
import { AppRuntimeLoadErrorScreen } from "@/lib/brand/AppRuntimeLoadErrorScreen";
import { useTaqfeelahPrototypeRuntime } from "@/lib/brand/use-taqfeelah-prototype-runtime";

export default function AppRuntimePage() {
  const { Runtime, loadError, retryLoad } = useTaqfeelahPrototypeRuntime();

  const runtimeContent = Runtime ? (
    <Runtime />
  ) : loadError ? (
    <AppRuntimeLoadErrorScreen onSoftRetry={retryLoad} />
  ) : null;

  return (
    <ErrorBoundary>
      <PrototypeClientGate>{runtimeContent}</PrototypeClientGate>
    </ErrorBoundary>
  );
}
