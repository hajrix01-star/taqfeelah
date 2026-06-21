"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AppQueryProvider } from "@/core/client/app-query-provider";
import { migratePrototypeDemoDatasetIfNeeded } from "./prototype-demo-migrate";
import { PROTOTYPE_BUILD_STAMP } from "@/prototype-build-stamp.mjs";
import { isProductionAppMode } from "@/core/config/app-mode";
import { ReleaseVersionLine } from "@/release/ReleaseVersionLine";

/**
 * Runs demo migration off the critical path so phones don't freeze on first paint.
 */
export default function PrototypeClientGate({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState("loading");
  const [error, setError] = useState("");
  const productionMode = isProductionAppMode();

  useEffect(() => {
    if (productionMode) {
      setPhase("ready");
      return undefined;
    }

    let cancelled = false;
    const timer = window.setTimeout(() => {
      try {
        const result = migratePrototypeDemoDatasetIfNeeded();
        if (!cancelled) setPhase(result?.error ? "error" : "ready");
        if (result?.error && !cancelled) setError(result.error);
      } catch (err) {
        if (!cancelled) {
          setPhase("error");
          setError(err instanceof Error ? err.message : "migrate-failed");
        }
      }
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [productionMode]);

  if (phase === "loading") {
    return (
      <div
        className="flex min-h-[100dvh] flex-col items-center justify-center gap-3 bg-[#F8F6F0] px-6 text-center text-sm font-bold text-[#827762]"
        dir="rtl"
        style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <p className="text-[#112A46]">
          {productionMode ? "جاري تهيئة النظام…" : "جاري تحضير البيانات التجريبية…"}
        </p>
        <ReleaseVersionLine
          className="text-taq-meta font-bold text-[#A99D87]"
          lang="ar"
          showBuild
        />
        {!productionMode ? (
          <p className="text-taq-meta font-bold text-[#A99D87]" dir="ltr">
            {PROTOTYPE_BUILD_STAMP}
          </p>
        ) : null}
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div
        className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 bg-[#F8F6F0] px-6 text-center"
        dir="rtl"
        style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <p className="text-sm font-black text-[#B44747]">تعذّر تحميل البيانات على هذا الجهاز</p>
        <p className="text-xs font-bold leading-6 text-[#827762]">
          {error === "quota"
            ? "مساحة التخزين المحلي ممتلئة. احذف بيانات الموقع من إعدادات المتصفح ثم أعد المحاولة."
            : "أعد تحميل الصفحة. إن استمر الخطأ، امسح بيانات الموقع (localStorage) لهذا العنوان."}
        </p>
        <button
          type="button"
          className="rounded-2xl bg-[#112A46] px-5 py-3 text-xs font-black text-white"
          onClick={() => {
            try {
              Object.keys(window.localStorage)
                .filter((key) => key.startsWith("taqfeelah_"))
                .forEach((key) => window.localStorage.removeItem(key));
            } catch { /* ignore */ }
            window.location.reload();
          }}
        >
          مسح بيانات تقفيلة وإعادة المحاولة
        </button>
      </div>
    );
  }

  return <AppQueryProvider>{children}</AppQueryProvider>;
}
