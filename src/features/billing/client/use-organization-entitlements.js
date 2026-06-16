"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchOrganizationEntitlementsViaApi } from "@/features/billing/client/billing-api-client";
import {
  readOrganizationEntitlementsCache,
  writeOrganizationEntitlementsCache,
} from "@/features/billing/client/organization-entitlements-cache";

export function useOrganizationEntitlements({
  enabled = false,
  auth = {},
}) {
  const authKey = useMemo(
    () => `${auth?.organizationId || ""}|${auth?.actorUserId || ""}|${auth?.actorRole || ""}`,
    [auth?.actorRole, auth?.actorUserId, auth?.organizationId],
  );

  const canLoad = enabled
    && Boolean(auth?.organizationId)
    && Boolean(auth?.actorUserId);

  const cachedEntry = canLoad ? readOrganizationEntitlementsCache(authKey) : null;

  const [entitlements, setEntitlements] = useState(() => cachedEntry?.entitlements ?? null);
  const [loading, setLoading] = useState(() => canLoad && !cachedEntry);
  const [error, setError] = useState(() => cachedEntry?.error ?? "");
  const loadedAuthKeyRef = useRef(cachedEntry ? authKey : "");

  const reload = useCallback(async () => {
    if (!canLoad) return;
    setLoading(true);
    setError("");
    try {
      const payload = await fetchOrganizationEntitlementsViaApi(auth);
      setEntitlements(payload);
      loadedAuthKeyRef.current = authKey;
      writeOrganizationEntitlementsCache(authKey, { entitlements: payload, error: "" });
    } catch (failure) {
      console.warn("subscription entitlements load failed", failure);
      const message = failure instanceof Error ? failure.message : "subscription entitlements load failed";
      setError(message);
      loadedAuthKeyRef.current = authKey;
      writeOrganizationEntitlementsCache(authKey, { entitlements: null, error: message });
    } finally {
      setLoading(false);
    }
  }, [auth, authKey, canLoad]);

  useEffect(() => {
    if (!canLoad) {
      setEntitlements(null);
      setLoading(false);
      setError("");
      loadedAuthKeyRef.current = "";
      return;
    }

    const cached = readOrganizationEntitlementsCache(authKey);
    if (cached) {
      setEntitlements(cached.entitlements ?? null);
      setError(cached.error ?? "");
      setLoading(false);
      loadedAuthKeyRef.current = authKey;
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
