"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  buildRuntimeSettingsPersistPayload,
  serializeRuntimeSettingsSignature,
} from "./runtime-settings-bridge.js";
import {
  fetchRuntimeSettingsViaApi,
  saveRuntimeSettingsViaApi,
} from "./runtime-session-and-settings-api-client.js";

function resolveRuntimeSettingsLoadError(lang) {
  return lang === "ar"
    ? "تعذر تحميل إعدادات التشغيل من الخادم."
    : "Failed to load runtime settings from server.";
}

function resolveRuntimeSettingsSaveError(lang) {
  return lang === "ar"
    ? "تعذر حفظ إعدادات التشغيل على الخادم."
    : "Failed to save runtime settings on server.";
}

export function useRuntimeSettingsFromApi({
  enabled = false,
  auth = {},
  loggedIn = false,
  isEmployee = false,
  lang = "ar",
  snapshot = {},
  onHydrate = () => {},
  autosaveDelayMs = 450,
}) {
  const hydratedRef = useRef(!enabled);
  const persistTimerRef = useRef(null);
  const lastSavedSignatureRef = useRef("");
  const loadedAuthKeyRef = useRef("");
  const [syncError, setSyncError] = useState("");

  const authKey = useMemo(
    () => `${auth?.organizationId || ""}|${auth?.actorUserId || ""}|${auth?.actorRole || ""}`,
    [auth?.actorRole, auth?.actorUserId, auth?.organizationId],
  );

  const resetSyncState = useCallback(() => {
    hydratedRef.current = !enabled;
    lastSavedSignatureRef.current = "";
    loadedAuthKeyRef.current = "";
    if (persistTimerRef.current) {
      window.clearTimeout(persistTimerRef.current);
      persistTimerRef.current = null;
    }
  }, [enabled]);

  const persistNow = useCallback(async (partialSettings = {}) => {
    if (!enabled) return null;
    const settings = buildRuntimeSettingsPersistPayload(snapshot, partialSettings);
    const saved = await saveRuntimeSettingsViaApi({
      settings,
      reason: "owner_settings_explicit_save",
      ...auth,
    });
    if (saved?.settings && typeof saved.settings === "object") {
      onHydrate(saved.settings);
      lastSavedSignatureRef.current = serializeRuntimeSettingsSignature(saved.settings);
    }
    return saved;
  }, [auth, enabled, onHydrate, snapshot]);

  useEffect(() => {
    if (!enabled || !loggedIn || isEmployee) {
      resetSyncState();
      setSyncError("");
      return undefined;
    }
    if (hydratedRef.current && loadedAuthKeyRef.current === authKey) {
      return undefined;
    }
    loadedAuthKeyRef.current = authKey;

    let cancelled = false;
    fetchRuntimeSettingsViaApi(auth)
      .then((payload) => {
        if (cancelled) return;
        if (payload?.settings && typeof payload.settings === "object") {
          onHydrate(payload.settings);
          lastSavedSignatureRef.current = serializeRuntimeSettingsSignature(payload.settings);
        }
        hydratedRef.current = true;
        setSyncError("");
      })
      .catch((error) => {
        if (cancelled) return;
        console.warn("runtime settings load failed", error);
        setSyncError(resolveRuntimeSettingsLoadError(lang));
      });

    return () => {
      cancelled = true;
    };
  }, [auth, authKey, enabled, isEmployee, lang, loggedIn, onHydrate, resetSyncState]);

  useEffect(() => {
    if (!enabled || !loggedIn || isEmployee) return undefined;
    if (!hydratedRef.current || syncError) return undefined;

    const signature = serializeRuntimeSettingsSignature(snapshot);
    if (lastSavedSignatureRef.current === signature) return undefined;

    if (persistTimerRef.current) {
      window.clearTimeout(persistTimerRef.current);
    }
    persistTimerRef.current = window.setTimeout(() => {
      saveRuntimeSettingsViaApi({
        settings: snapshot,
        reason: "owner_settings_autosave",
        ...auth,
      })
        .then(() => {
          lastSavedSignatureRef.current = signature;
          setSyncError("");
        })
        .catch((error) => {
          console.warn("runtime settings save failed", error);
          setSyncError(resolveRuntimeSettingsSaveError(lang));
        });
    }, autosaveDelayMs);

    return () => {
      if (persistTimerRef.current) {
        window.clearTimeout(persistTimerRef.current);
      }
    };
  }, [auth, autosaveDelayMs, enabled, isEmployee, lang, loggedIn, snapshot, syncError]);

  return {
    syncError,
    persistNow,
    resetSyncState,
  };
}
