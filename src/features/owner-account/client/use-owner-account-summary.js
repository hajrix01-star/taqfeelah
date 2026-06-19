"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchOwnerAccountSummaryViaApi } from "@/features/owner-account/client/owner-account-api-client";

function resolveOwnerAccountLoadError(lang) {
  return lang === "ar"
    ? "تعذر تحميل بيانات الحساب."
    : "Failed to load account details.";
}

export function useOwnerAccountSummary({
  enabled = false,
  auth = {},
  lang = "ar",
}) {
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const authKey = useMemo(
    () => `${auth?.organizationId || ""}|${auth?.actorUserId || ""}|${auth?.actorRole || ""}`,
    [auth?.actorRole, auth?.actorUserId, auth?.organizationId],
  );

  const reload = useCallback(async () => {
    if (!enabled || !auth?.organizationId || !auth?.actorUserId) {
      setAccount(null);
      setError("");
      setLoading(false);
      return null;
    }

    setLoading(true);
    setError("");
    try {
      const payload = await fetchOwnerAccountSummaryViaApi(auth);
      setAccount(payload);
      return payload;
    } catch (failure) {
      console.warn("owner account load failed", failure);
      setError(resolveOwnerAccountLoadError(lang));
      setAccount(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, [auth, enabled, lang]);

  useEffect(() => {
    if (!enabled) {
      setAccount(null);
      setError("");
      setLoading(false);
      return undefined;
    }
    void reload();
  }, [authKey, enabled, reload]);

  return {
    account,
    loading,
    error,
    reload,
  };
}
