"use client";

import { useCallback, useEffect, useState, type ComponentType } from "react";
import { loadTaqfeelahAppRuntime } from "@/lib/brand/load-taqfeelah-app-runtime";

export function useTaqfeelahAppRuntime() {
  const [Runtime, setRuntime] = useState<ComponentType | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoadError(false);

    void loadTaqfeelahAppRuntime()
      .then((component) => {
        if (cancelled) return;
        setRuntime(() => component);
      })
      .catch((error) => {
        if (cancelled) return;
        console.error("Failed to load TaqfeelahAppRuntime", error);
        setLoadError(true);
      });

    return () => {
      cancelled = true;
    };
  }, [loadAttempt]);

  const retryLoad = useCallback(() => {
    setRuntime(null);
    setLoadAttempt((attempt) => attempt + 1);
  }, []);

  return { Runtime, loadError, retryLoad };
}
