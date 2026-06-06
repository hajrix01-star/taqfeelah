"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchOrgConfigBundleViaApi } from "./org-config-api-client.js";
import {
  buildOrgConfigPersistBaseline,
  mapOrgConfigBundleToRuntime,
} from "./org-config-runtime-mapper.js";
import { persistOrgConfigSnapshot } from "./org-config-runtime-sync.js";

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
  const hydratedRef = useRef(!enabled);
  const applyingRef = useRef(false);
  const baselineRef = useRef("");
  const persistTimerRef = useRef(null);

  const loadOrgConfig = useCallback(async () => {
    if (!enabled || !loggedIn || isEmployee) return;
    setLoading(true);
    setError("");
    try {
      const bundle = await fetchOrgConfigBundleViaApi(auth);
      const mapped = mapOrgConfigBundleToRuntime({
        ...bundle,
        employeePins,
      });
      applyingRef.current = true;
      onHydrate(mapped);
      baselineRef.current = buildOrgConfigPersistBaseline(mapped);
      hydratedRef.current = true;
    } catch (failure) {
      console.warn("org config load failed", failure);
      setError(failure instanceof Error ? failure.message : "org config load failed");
    } finally {
      applyingRef.current = false;
      setLoading(false);
    }
  }, [auth, employeePins, enabled, isEmployee, loggedIn, onHydrate]);

  useEffect(() => {
    if (!enabled || !loggedIn || isEmployee) {
      hydratedRef.current = !enabled;
      baselineRef.current = "";
      return;
    }
    loadOrgConfig();
  }, [enabled, isEmployee, loadOrgConfig, loggedIn]);

  useEffect(() => {
    if (!enabled || !loggedIn || isEmployee || !hydratedRef.current || applyingRef.current) return;

    const signature = buildOrgConfigPersistBaseline(snapshot);
    if (!baselineRef.current || baselineRef.current === signature) return;

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
          staff: baseline.staff,
        },
        next: snapshot,
        employeePins,
      })
        .then((applied) => {
          onPersistApplied(applied);
          baselineRef.current = buildOrgConfigPersistBaseline(applied);
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
    hydrated: hydratedRef.current,
    reload: loadOrgConfig,
  };
}
