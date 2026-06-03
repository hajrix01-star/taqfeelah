"use client";

import dynamic from "next/dynamic";
import PrototypeClientGate from "@/features/demo/PrototypeClientGate";

const TaqfeelahPrototypeRuntime = dynamic(
  () => import("@/components/TaqfeelahPrototypeRuntime"),
  {
    ssr: false,
    loading: () => (
      <div
        className="flex min-h-[100dvh] items-center justify-center bg-[#F8F6F0] text-sm font-bold text-[#827762]"
        dir="rtl"
        style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        جاري التحميل…
      </div>
    ),
  },
);

export default function PrototypeRuntimePage() {
  return (
    <PrototypeClientGate>
      <TaqfeelahPrototypeRuntime />
    </PrototypeClientGate>
  );
}
