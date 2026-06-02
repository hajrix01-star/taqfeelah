"use client";

import dynamic from "next/dynamic";

const TaqfeelahPrototypeRuntime = dynamic(
  () => import("@/components/TaqfeelahPrototypeRuntime"),
  {
    ssr: false,
    loading: () => (
      <div
        className="flex min-h-[100dvh] items-center justify-center bg-[#F8F6F0] text-sm font-bold text-[#827762]"
        dir="rtl"
      >
        جاري التحميل…
      </div>
    ),
  },
);

export default function PrototypeRuntimePage() {
  return <TaqfeelahPrototypeRuntime />;
}
