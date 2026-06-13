"use client";

import { useEffect, useState } from "react";

type PasswordResetStatus = {
  enabled?: boolean;
  data?: { enabled?: boolean };
};

export function usePasswordResetEnabled() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/v1/auth/password-reset/status", { credentials: "include" })
      .then((response) => response.json())
      .then((payload: PasswordResetStatus) => {
        if (cancelled) return;
        setEnabled(payload?.enabled === true || payload?.data?.enabled === true);
      })
      .catch(() => {
        if (!cancelled) setEnabled(false);
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
