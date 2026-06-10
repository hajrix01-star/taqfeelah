"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchOrgConfigBundleViaApi } from "./org-config-api-client.js";
import { bindsToServerAuth } from "@/core/config/runtime-capabilities";
import {
  buildOrgConfigPersistBaseline,
  mapOrgConfigBundleToRuntime,
  validateOrgConfigDbChannelMappings,
} from "./org-config-runtime-mapper.js";
import { persistOrgConfigSnapshot } from "./org-config-runtime-sync.js";

function tryBuildOrgConfigPersistBaseline(snapshot) {
  try {
    return buildOrgConfigPersistBaseline(snapshot);
  } catch (failure) {
    console.warn("org config baseline build failed", failure);
    return "";
  }
}

export function useOrgConfigFromApi({
  enabled = false,
  auth = {},
  loggedIn = false,
  isEmployee = false,
  snapshot = {},
  employeePins = {},
  onHydrate = () => {},
  onPersistApplied = () => {},
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const hydratedRef = useRef(false);
  const applyingRef = useRef(false);
  const baselineRef = useRef("");
  const persistTimerRef = useRef(null);
  const loadedAuthKeyRef = useRef("");

  const authKey = useMemo(
    () => `${auth?.organizationId || ""}|${auth?.actorUserId || ""}|${auth?.actorRole || ""}`,
    [auth?.actorRole, auth?.actorUserId, auth?.organizationId],
  );

  const loadOrgConfig = useCallback(async () => {
    if (!enabled || !loggedIn) return;
    setLoading(true);
    setError("");
    try {
      const bundle = await fetchOrgConfigBundleViaApi(auth);
      const mapped = mapOrgConfigBundleToRuntime({
        ...bundle,
        employeePins,
      });
      validateOrgConfigDbChannelMappings(mapped, { strict: bindsToServerAuth() });
      applyingRef.current = true;
      onHydrate(mapped);
      baselineRef.current = tryBuildOrgConfigPersistBaseline(mapped);
      hydratedRef.current = true;
      setHydrated(true);
    } catch (failure) {
      console.warn("org config load failed", failure);
      setError(failure instanceof Error ? failure.message : "org config load failed");
    } finally {
      applyingRef.current = false;
      setLoading(false);
    }
  }, [auth, employeePins, enabled, loggedIn, onHydrate]);

  useEffect(() => {
    if (!enabled || !loggedIn) {
      hydratedRef.current = false;
      setHydrated(false);
      baselineRef.current = "";
      loadedAuthKeyRef.current = "";
      return;
    }
    if (hydratedRef.current && loadedAuthKeyRef.current === authKey) {
      return;
    }
    loadedAuthKeyRef.current = authKey;
    hydratedRef.current = false;
    setHydrated(false);
    loadOrgConfig();
  }, [authKey, enabled, loadOrgConfig, loggedIn]);

  useEffect(() => {
    if (!enabled || !loggedIn || isEmployee || !hydratedRef.current || applyingRef.current) return;

    const signature = tryBuildOrgConfigPersistBaseline(snapshot);
    if (!signature || !baselineRef.current || baselineRef.current === signature) return;

    if (persistTimerRef.current) {
      window.clearTimeout(persistTimerRef.current);
    }

    persistTimerRef.current = window.setTimeout(() => {
      const baseline = JSON.parse(baselineRef.current);
      persistOrgConfigSnapshot({
        auth,
        baseline: {
          configuredBusinesses: baseline.businesses.map((business) => ({
            id: business.id,
            dbStoreId: business.dbStoreId,
            displayName: business.displayName,
            nameAr: business.displayName,
            nameEn: business.displayName,
            customLocation: business.customLocation,
          })),
          archivedBusinessIds: baseline.archivedBusinessIds,
          storeChannelSettings: baseline.storeChannelSettings,
          storeOperationalSettings: baseline.storeOperationalSettings,
          staff: baseline.staff,
        },
        next: snapshot,
        employeePins,
      })
        .then((applied) => {
          onPersistApplied(applied);
          baselineRef.current = tryBuildOrgConfigPersistBaseline(applied);
          setError("");
        })
        .catch((failure) => {
          console.warn("org config save failed", failure);
          setError(failure instanceof Error ? failure.message : "org config save failed");
        });
    }, 450);

    return () => {
      if (persistTimerRef.current) {
        window.clearTimeout(persistTimerRef.current);
      }
    };
  }, [auth, employeePins, enabled, isEmployee, loggedIn, onPersistApplied, snapshot]);

  return {
    loading,
    error,
    hydrated,
    reload: loadOrgConfig,
  };
}
