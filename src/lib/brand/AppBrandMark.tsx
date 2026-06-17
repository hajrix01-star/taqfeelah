"use client";

import { PWA_DESCRIPTION } from "@/core/config/pwa";
import { TAQFEELAH_LOGO_SRC } from "@/lib/brand/taqfeelah-logo";

type AppBrandMarkProps = {
  compact?: boolean;
  showTagline?: boolean;
  tagline?: string;
};

export function AppBrandMark({
  compact = false,
  showTagline = false,
  tagline = PWA_DESCRIPTION,
}: AppBrandMarkProps) {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <img
        src={TAQFEELAH_LOGO_SRC}
        alt="تقفيلة"
        draggable={false}
        className={`select-none object-contain ${compact ? "h-[44px] w-[132px]" : "h-[68px] w-[176px]"}`}
      />
      {showTagline ? (
        <p className="max-w-[280px] text-sm font-extrabold leading-6 text-[#827762]">{tagline}</p>
      ) : null}
    </div>
  );
}
