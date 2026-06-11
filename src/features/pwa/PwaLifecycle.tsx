"use client";

import { useEffect, useState } from "react";

type UpdatePhase = "idle" | "available";

export default function PwaLifecycle() {
  const [updatePhase, setUpdatePhase] = useState<UpdatePhase>("idle");

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return undefined;

    const onControllerChange = () => {
      window.location.reload();
    };

    const watchRegistration = (registration: ServiceWorkerRegistration) => {
      if (registration.waiting && navigator.serviceWorker.controller) {
        setUpdatePhase("available");
      }

      registration.addEventListener("updatefound", () => {
        const worker = registration.installing;
        if (!worker) return;

        worker.addEventListener("statechange", () => {
          if (worker.state === "installed" && navigator.serviceWorker.controller) {
            setUpdatePhase("available");
          }
        });
      });
    };

    navigator.serviceWorker.ready.then(watchRegistration).catch(() => undefined);
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
          }}
        >
          تحديث الآن
        </button>
      </div>
    </div>
  );
}
