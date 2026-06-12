"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchOrganizationEntitlementsViaApi } from "@/features/billing/client/billing-api-client";

export function useOrganizationEntitlements({
  enabled = false,
  auth = {},
}) {
  const [entitlements, setEntitlements] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const loadedAuthKeyRef = useRef("");

  const authKey = useMemo(
    () => `${auth?.organizationId || ""}|${auth?.actorUserId || ""}|${auth?.actorRole || ""}`,
    [auth?.actorRole, auth?.actorUserId, auth?.organizationId],
  );

  const canLoad = enabled
    && Boolean(auth?.organizationId)
    && Boolean(auth?.actorUserId);

  const reload = useCallback(async () => {
    if (!canLoad) return;
    setLoading(true);
    setError("");
    try {
      const payload = await fetchOrganizationEntitlementsViaApi(auth);
      setEntitlements(payload);
      loadedAuthKeyRef.current = authKey;
    } catch (failure) {
      console.warn("subscription entitlements load failed", failure);
      setError(failure instanceof Error ? failure.message : "subscription entitlements load failed");
    } finally {
      setLoading(false);
    }
  }, [auth, authKey, canLoad]);

  useEffect(() => {
    if (!canLoad) {
      setEntitlements(null);
      loadedAuthKeyRef.current = "";
      return;
    }
    if (loadedAuthKeyRef.current === authKey) {
      return;
    }
    reload();
  }, [authKey, canLoad, reload]);

  return {
    entitlements,
    loading,
    error,
    reload,
  };
}
