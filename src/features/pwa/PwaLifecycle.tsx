"use client";

import { useCallback, useEffect, useState } from "react";
import { isReleaseUpdateAvailable } from "@/release/check-update-available";
import { getClientReleaseBuild } from "@/release/client-release";
import type { ReleaseMeta } from "@/release/version";

type UpdatePhase = "idle" | "available";

async function fetchServerReleaseMeta(): Promise<ReleaseMeta | null> {
  try {
    const response = await fetch("/api/v1/meta", { cache: "no-store" });
    if (!response.ok) return null;
    const payload = (await response.json()) as ReleaseMeta;
    if (!payload?.build || !payload?.label || !payload?.version) return null;
    return payload;
  } catch {
    return null;
  }
}

export default function PwaLifecycle() {
  const [updatePhase, setUpdatePhase] = useState<UpdatePhase>("idle");
  const clientBuild = getClientReleaseBuild();

  const evaluateUpdate = useCallback(async () => {
    if (process.env.NODE_ENV === "development") {
      setUpdatePhase("idle");
      return;
    }

    const serverMeta = await fetchServerReleaseMeta();
    if (!isReleaseUpdateAvailable(clientBuild, serverMeta?.build)) {
      setUpdatePhase("idle");
      return;
    }

    setUpdatePhase("available");
  }, [clientBuild]);

  useEffect(() => {
    void evaluateUpdate();

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void evaluateUpdate();
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [evaluateUpdate]);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return undefined;

    const onControllerChange = () => {
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
    };
  }, []);

  if (updatePhase !== "available") return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[500] border-t border-[#ECE6DA] bg-[#112A46] px-4 py-3 text-white shadow-[0_-12px_40px_rgba(17,42,70,0.25)]"
      dir="rtl"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      role="status"
      aria-live="polite"
    >
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-bold">نسخة جديدة من تقفيلة متاحة.</p>
        <button
          type="button"
          className="rounded-2xl bg-white px-4 py-2 text-sm font-black text-[#112A46]"
          onClick={async () => {
            const registration = await navigator.serviceWorker.getRegistration();
            registration?.waiting?.postMessage({ type: "SKIP_WAITING" });
            setUpdatePhase("idle");
            window.location.reload();
          }}
        >
          تحديث الآن
        </button>
      </div>
    </div>
  );
}
