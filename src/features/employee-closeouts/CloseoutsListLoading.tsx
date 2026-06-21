"use client";

import type { CloseoutSyncLang } from "@/features/daily-closeouts/daily-closeouts-types";

function CloseoutCardSkeleton() {
  return (
    <article
      aria-hidden="true"
      className="overflow-hidden rounded-[19px] border border-[#E8E1D4] bg-[rgba(255,252,244,0.94)] shadow-[0_8px_22px_rgba(17,42,70,0.08)]"
    >
      <div className="px-4 py-4">
        <div className="mb-4 flex items-center justify-between gap-2">
          <div className="h-4 w-28 animate-pulse rounded-full bg-[#E8E1D4]/90" />
          <div className="h-7 w-16 animate-pulse rounded-full bg-[#E8E1D4]/80" />
        </div>
        <div className="grid grid-cols-4 overflow-hidden rounded-[14px] border border-[#E8E1D4] bg-[rgba(255,252,245,0.72)]">
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              className={`min-w-0 border-s border-[#E8E1D4] px-1 py-3 text-center ${index === 0 ? "border-s-0" : ""}`}
            >
              <div className="mx-auto mb-2 h-2.5 w-8 animate-pulse rounded-full bg-[#E8E1D4]/80" />
              <div className="mx-auto h-6 w-10 animate-pulse rounded-md bg-[#E8E1D4]/90" />
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}

export default function CloseoutsListLoading({
  lang,
  count = 2,
}: {
  lang: CloseoutSyncLang;
  count?: number;
}) {
  return (
    <div
      className="flex flex-col gap-3.5"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={lang === "ar" ? "جاري تحميل التقفيلات" : "Loading closeouts"}
    >
      <p className="text-center text-taq-meta font-bold text-[#806528]">
        {lang === "ar" ? "جاري تحميل التقفيلات…" : "Loading closeouts…"}
      </p>
      {Array.from({ length: count }, (_, index) => (
        <CloseoutCardSkeleton key={index} />
      ))}
    </div>
  );
}
