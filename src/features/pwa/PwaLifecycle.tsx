"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { shouldShowPwaUpdatePrompt } from "@/features/pwa/pwa-update-policy";
import {
  activateWaitingServiceWorker,
  readServiceWorkerRegistrationSnapshot,
  requestServiceWorkerUpdateCheck,
  subscribeToServiceWorkerUpdates,
} from "@/features/pwa/pwa-service-worker";
import {
  clearDismissedUpdateBuild,
  readDismissedUpdateBuild,
  rememberDismissedUpdateBuild,
} from "@/features/pwa/pwa-update-storage";
import { getClientReleaseBuild } from "@/release/client-release";
import type { ReleaseMeta } from "@/release/version";

type UpdatePhase = "idle" | "available";

const UPDATE_CHECK_COOLDOWN_MS = 5 * 60 * 1000;

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
  const [pendingServerBuild, setPendingServerBuild] = useState<string | null>(null);
  const clientBuild = getClientReleaseBuild();
  const lastUpdateCheckAtRef = useRef(0);

  const evaluateUpdate = useCallback(async (force = false) => {
    if (process.env.NODE_ENV === "development") {
      setUpdatePhase("idle");
      setPendingServerBuild(null);
      return;
    }

    const now = Date.now();
    if (!force && now - lastUpdateCheckAtRef.current < UPDATE_CHECK_COOLDOWN_MS) {
      return;
    }
    lastUpdateCheckAtRef.current = now;

    const [serverMeta, swSnapshot] = await Promise.all([
      fetchServerReleaseMeta(),
      readServiceWorkerRegistrationSnapshot(),
    ]);

    const serverBuild = serverMeta?.build ?? null;

    if (serverBuild && serverBuild === clientBuild) {
      clearDismissedUpdateBuild();
      setPendingServerBuild(null);
      setUpdatePhase("idle");
      return;
    }

    const shouldShow = shouldShowPwaUpdatePrompt({
      clientBuild,
      serverBuild,
      hasWaitingServiceWorker: swSnapshot.hasWaitingServiceWorker,
      dismissedServerBuild: readDismissedUpdateBuild(),
    });

    if (!shouldShow) {
      setPendingServerBuild(null);
      setUpdatePhase("idle");
      return;
    }

    setPendingServerBuild(serverBuild);
    setUpdatePhase("available");
  }, [clientBuild]);

  useEffect(() => {
    void evaluateUpdate(true);

    const unsubscribe = subscribeToServiceWorkerUpdates(() => {
      void evaluateUpdate(true);
    });

    const onVisibilityChange = () => {
      if (document.visibilityState !== "visible") return;
      void requestServiceWorkerUpdateCheck();
      void evaluateUpdate(false);
    };

    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      unsubscribe();
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

  if (updatePhase !== "available" || !pendingServerBuild) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[500] border-t border-[#ECE6DA] bg-[#112A46] px-4 py-3 text-white shadow-[0_-12px_40px_rgba(17,42,70,0.25)]"
      dir="rtl"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      role="status"
      aria-live="polite"
    >
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-bold">نسخة جديدة من تقفيلة جاهزة للتثبيت.</p>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="rounded-2xl border border-white/30 px-4 py-2 text-sm font-bold text-white"
            onClick={() => {
              rememberDismissedUpdateBuild(pendingServerBuild);
              setUpdatePhase("idle");
              setPendingServerBuild(null);
            }}
          >
            لاحقًا
          </button>
          <button
            type="button"
            className="rounded-2xl bg-white px-4 py-2 text-sm font-black text-[#112A46]"
            onClick={async () => {
              await activateWaitingServiceWorker();
              clearDismissedUpdateBuild();
              setUpdatePhase("idle");
              setPendingServerBuild(null);
              window.location.reload();
            }}
          >
            تحديث الآن
          </button>
        </div>
      </div>
    </div>
  );
}
