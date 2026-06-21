"use client";

import { useCallback, useMemo } from "react";
import { useOrgConfigFromApi } from "./use-org-config-from-api";
import type {
  OrgConfigRuntimeMapped,
  OrgConfigRuntimeSetters,
  OrgConfigRuntimeSnapshot,
  OrgConfigApiAuth,
} from "./org-config-client-types";

export function buildOrgConfigRuntimeSnapshot({
  configuredBusinesses,
  archivedBusinessIds,
  storeChannelSettings,
  storeOperationalSettings,
  staff,
}: OrgConfigRuntimeSnapshot): OrgConfigRuntimeSnapshot {
  return {
    configuredBusinesses,
    archivedBusinessIds,
    storeChannelSettings,
    storeOperationalSettings,
    staff,
  };
}

export function applyOrgConfigMappedState(
  mapped: OrgConfigRuntimeMapped,
  setters: OrgConfigRuntimeSetters,
) {
  if (!mapped || typeof mapped !== "object") return;

  if (Array.isArray(mapped.configuredBusinesses)) {
    setters.setConfiguredBusinesses(mapped.configuredBusinesses);
  }
  if (Array.isArray(mapped.archivedBusinessIds)) {
    setters.setArchivedBusinessIds(mapped.archivedBusinessIds);
  }
  if (mapped.storeChannelSettings && typeof mapped.storeChannelSettings === "object") {
    setters.setStoreChannelSettings(mapped.storeChannelSettings);
  }
  if (Array.isArray(mapped.staff)) {
    setters.setStaff(mapped.staff);
  }
  if (mapped.storeOperationalSettings && typeof mapped.storeOperationalSettings === "object") {
    setters.setStoreOperationalSettings(mapped.storeOperationalSettings);
  }
}

export function useOrgConfigRuntimeBridge({
  enabled,
  auth,
  loggedIn,
  isEmployee,
  employeePins,
  configuredBusinesses,
  archivedBusinessIds,
  storeChannelSettings,
  storeOperationalSettings,
  staff,
  setConfiguredBusinesses,
  setArchivedBusinessIds,
  setStoreChannelSettings,
  setStoreOperationalSettings,
  setStaff,
}: {
  enabled: boolean;
  auth: OrgConfigApiAuth;
  loggedIn: boolean;
  isEmployee: boolean;
  employeePins: Record<string, string>;
  configuredBusinesses: Array<Record<string, unknown>>;
  archivedBusinessIds: string[];
  storeChannelSettings: OrgConfigRuntimeSnapshot["storeChannelSettings"];
  storeOperationalSettings: Record<string, unknown>;
  staff: Array<Record<string, unknown>>;
  setConfiguredBusinesses: OrgConfigRuntimeSetters["setConfiguredBusinesses"];
  setArchivedBusinessIds: OrgConfigRuntimeSetters["setArchivedBusinessIds"];
  setStoreChannelSettings: OrgConfigRuntimeSetters["setStoreChannelSettings"];
  setStoreOperationalSettings: OrgConfigRuntimeSetters["setStoreOperationalSettings"];
  setStaff: OrgConfigRuntimeSetters["setStaff"];
}) {
  const snapshot = useMemo(
    () => buildOrgConfigRuntimeSnapshot({
      configuredBusinesses,
      archivedBusinessIds,
      storeChannelSettings,
      storeOperationalSettings,
      staff,
    }),
    [configuredBusinesses, archivedBusinessIds, storeChannelSettings, storeOperationalSettings, staff],
  );

  const setters = useMemo(() => ({
    setConfiguredBusinesses,
    setArchivedBusinessIds,
    setStoreChannelSettings,
    setStoreOperationalSettings,
    setStaff,
  }), [
    setArchivedBusinessIds,
    setConfiguredBusinesses,
    setStaff,
    setStoreChannelSettings,
    setStoreOperationalSettings,
  ]);

  const onHydrate = useCallback((mapped: OrgConfigRuntimeMapped) => {
    applyOrgConfigMappedState(mapped, setters);
  }, [setters]);

  const sync = useOrgConfigFromApi({
    enabled,
    auth,
    loggedIn,
    isEmployee,
    snapshot,
    employeePins,
    onHydrate,
  });

  return {
    snapshot,
    ...sync,
  };
}
