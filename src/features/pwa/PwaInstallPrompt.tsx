"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  detectPwaInstallPlatform,
  isIosInstallableBrowser,
  isPwaStandalone,
  supportsPwaInstallPrompt,
} from "@/features/pwa/pwa-install-detection";
import { shouldShowPwaInstallPrompt } from "@/features/pwa/pwa-install-policy";
import {
  readPwaInstallDismissedAt,
  rememberPwaInstallDismissed,
} from "@/features/pwa/pwa-install-storage";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type InstallPhase = "hidden" | "visible";

export default function PwaInstallPrompt() {
  const pathname = usePathname() || "/";
  const [phase, setPhase] = useState<InstallPhase>("hidden");
  const [platform, setPlatform] = useState<ReturnType<typeof detectPwaInstallPlatform>>("unknown");
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  const evaluateVisibility = useCallback(() => {
    if (process.env.NODE_ENV === "development") {
      setPhase("hidden");
      return;
    }

    if (!supportsPwaInstallPrompt()) {
      setPhase("hidden");
      return;
    }

    const resolvedPlatform = detectPwaInstallPlatform();
    setPlatform(resolvedPlatform);

    const visible = shouldShowPwaInstallPrompt({
      pathname,
      isStandalone: isPwaStandalone(),
      platform: resolvedPlatform,
      hasDeferredInstallPrompt: Boolean(deferredPrompt),
      dismissedAt: readPwaInstallDismissedAt(),
    });

    setPhase(visible ? "visible" : "hidden");
  }, [deferredPrompt, pathname]);

  useEffect(() => {
    evaluateVisibility();
  }, [evaluateVisibility]);

  useEffect(() => {
    if (process.env.NODE_ENV === "development") return undefined;

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const onAppInstalled = () => {
      setDeferredPrompt(null);
      setPhase("hidden");
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  useEffect(() => {
    if (!deferredPrompt) return;
    evaluateVisibility();
  }, [deferredPrompt, evaluateVisibility]);

  const dismiss = () => {
    rememberPwaInstallDismissed();
    setPhase("hidden");
  };

  const install = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setPhase("hidden");
  };

  if (phase !== "visible") return null;

  const iosGuide = platform === "ios" || isIosInstallableBrowser();
  const canInstallNatively = Boolean(deferredPrompt);

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[490] border-t border-[#ECE6DA] bg-[#F7F5EF] px-4 py-3 text-[#112A46] shadow-[0_-12px_40px_rgba(17,42,70,0.12)]"
      dir="rtl"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      role="status"
      aria-live="polite"
    >
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-black">ثبّت تقفيلة على جهازك</p>
          <p className="mt-1 text-xs font-bold leading-5 text-[#827762]">
            {iosGuide && !canInstallNatively
              ? "من زر المشاركة في المتصفح اختر «إضافة إلى الشاشة الرئيسية»."
              : "افتح التطبيق مباشرة من الشاشة الرئيسية مثل أي تطبيق."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="rounded-2xl border border-[#E8E1D4] bg-white px-4 py-2 text-sm font-bold text-[#827762]"
            onClick={dismiss}
          >
            لاحقًا
          </button>
          {canInstallNatively ? (
            <button
              type="button"
              className="rounded-2xl bg-[#112A46] px-4 py-2 text-sm font-black text-white"
              onClick={() => {
                void install();
              }}
            >
              تثبيت الآن
            </button>
          ) : (
            <button
              type="button"
              className="rounded-2xl bg-[#112A46] px-4 py-2 text-sm font-black text-white"
              onClick={dismiss}
            >
              فهمت
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
