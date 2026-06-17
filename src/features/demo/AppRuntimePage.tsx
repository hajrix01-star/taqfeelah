"use client";

import dynamic from "next/dynamic";
import ErrorBoundary from "@/components/ErrorBoundary";
import PrototypeClientGate from "@/features/demo/PrototypeClientGate";
import { AppBrandMark } from "@/lib/brand/AppBrandMark";

const TaqfeelahPrototypeRuntime = dynamic(
  () => import("@/components/TaqfeelahPrototypeRuntime"),
  {
    ssr: false,
    loading: () => (
      <div
        className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 bg-[#F8F6F0] px-6"
        dir="rtl"
        style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <AppBrandMark showTagline />
      </div>
    ),
  },
);

export default function AppRuntimePage() {
  return (
    <ErrorBoundary>
      <PrototypeClientGate>
        <TaqfeelahPrototypeRuntime />
      </PrototypeClientGate>
    </ErrorBoundary>
  );
}
