"use client";

import { useCallback, useEffect, useState, type ComponentType } from "react";
import { loadTaqfeelahPrototypeRuntime } from "@/lib/brand/load-taqfeelah-prototype-runtime";

export function useTaqfeelahPrototypeRuntime() {
  const [Runtime, setRuntime] = useState<ComponentType | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoadError(false);

    void loadTaqfeelahPrototypeRuntime()
      .then((component) => {
        if (cancelled) return;
        setRuntime(() => component);
      })
      .catch((error) => {
        if (cancelled) return;
        console.error("Failed to load TaqfeelahPrototypeRuntime", error);
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
