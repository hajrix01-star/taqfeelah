"use client";

import { useEffect, useState } from "react";
import { getPublicSignupStatusViaApi } from "@/features/signup/client/signup-api-client";

export function usePublicSignupEnabled() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void getPublicSignupStatusViaApi()
      .then((result) => {
        if (!cancelled) setEnabled(result.enabled);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { enabled, loading };
}
