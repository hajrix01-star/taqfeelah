"use client";

import { useEffect, useRef, useState } from "react";
import { buildRuntimeApiIdMaps } from "@/core/client/runtime-api-id-maps";
import { resolveClientOrganizationId } from "@/core/client/resolve-client-organization-id";
import { isUuid, setRuntimeApiIdMaps } from "@/features/closeouts/client/closeouts-api-client";
import {
  patchEmployeeStaffStoreIdsFromHydration,
  patchRuntimeApiMapsForEmployeeSession,
  syncLoggedInEmployeeIdFromSession,
} from "@/features/employee-closeouts/employee-portal-session";
import { applyServerSessionBootstrap } from "@/features/auth/client/auth-runtime-orchestrator";
import { fetchServerSessionStatus } from "@/features/auth/client/session-bridge";
import { applyOrgConfigMappedState } from "@/features/org-config/client/org-config-runtime-bridge";
import { loadEmployeeRuntimeContextFromApi } from "@/features/org-config/client/employee-runtime-hydration";
import {
  APP_IN_PRODUCTION_MODE,
  BINDS_TO_SERVER_AUTH,
  ORG_CONFIG_API_ENABLED,
} from "@/components/prototype-runtime/prototype-runtime-boot";
import { readPrototypeAuthBoot } from "@/features/auth/client/auth-gate/read-runtime-auth-boot";

export function usePrototypeRuntimeSessionState() {
  const prototypeAuthBoot = readPrototypeAuthBoot();
  const [lang, setLang] = useState("ar");
  const [sessionOrganizationId, setSessionOrganizationId] = useState("");
  const [sessionUserId, setSessionUserId] = useState("");
  const [loggedIn, setLoggedIn] = useState(() => prototypeAuthBoot.loggedIn);
  const [authScreen, setAuthScreen] = useState("gateway");
  const [employee, setEmployee] = useState(() => prototypeAuthBoot.employee);
  const [loggedInEmployeeId, setLoggedInEmployeeId] = useState(() => prototypeAuthBoot.loggedInEmployeeId);
  const [employeeRuntimeReady, setEmployeeRuntimeReady] = useState(() => !prototypeAuthBoot.employee);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [sessionDisplayName, setSessionDisplayName] = useState("");

  return {
    prototypeAuthBoot,
    lang,
    setLang,
    sessionOrganizationId,
    setSessionOrganizationId,
    sessionUserId,
    setSessionUserId,
    loggedIn,
    setLoggedIn,
    authScreen,
    setAuthScreen,
    employee,
    setEmployee,
    loggedInEmployeeId,
    setLoggedInEmployeeId,
    employeeRuntimeReady,
    setEmployeeRuntimeReady,
    mustChangePassword,
    setMustChangePassword,
    sessionDisplayName,
    setSessionDisplayName,
  };
}

export function usePrototypeRuntimeSessionSync({
  loggedIn,
  employee,
  sessionOrganizationId,
  sessionUserId,
  loggedInEmployeeId,
  setSessionOrganizationId,
  setSessionUserId,
  setLoggedIn,
  setAuthScreen,
  setEmployee,
  setLoggedInEmployeeId,
  setEmployeeRuntimeReady,
  setOwnerPage,
  setEmployeePage,
  staff,
  setStaff,
  setConfiguredBusinesses,
  setArchivedBusinessIds,
  setStoreChannelSettings,
  setStoreOperationalSettings,
  setOwnerProfile,
  setMustChangePassword,
  setSessionDisplayName,
  employeeBusinessId,
  setEmployeeBusinessId,
  closeoutsApiEnabled,
  entriesApiEnabled,
  configuredBusinesses,
  storeChannelSettings,
}) {
  const employeeBusinessIdRef = useRef(employeeBusinessId);
  employeeBusinessIdRef.current = employeeBusinessId;

  useEffect(() => {
    if (!APP_IN_PRODUCTION_MODE) return;
    let cancelled = false;
    fetchServerSessionStatus()
      .then((session) => {
        if (cancelled) return;
        applyServerSessionBootstrap(session, {
          setSessionOrganizationId,
          setSessionUserId,
          setLoggedIn,
          setAuthScreen,
          setEmployee,
          setLoggedInEmployeeId,
          setEmployeePage,
          setOwnerPage,
          setOwnerProfile,
          setMustChangePassword,
          setSessionDisplayName,
        });
      })
      .catch((error) => {
        if (cancelled) return;
        console.warn("session bootstrap failed", error);
        setSessionOrganizationId("");
        setSessionUserId("");
      });
    return () => {
      cancelled = true;
    };
  }, [
    setAuthScreen,
    setEmployee,
    setEmployeePage,
    setLoggedIn,
    setLoggedInEmployeeId,
    setOwnerPage,
    setSessionOrganizationId,
    setSessionUserId,
    setOwnerProfile,
    setMustChangePassword,
    setSessionDisplayName,
  ]);

  useEffect(() => {
    if (!BINDS_TO_SERVER_AUTH || !employee || !sessionUserId) return;
    const syncedEmployeeId = syncLoggedInEmployeeIdFromSession(staff, sessionUserId, loggedInEmployeeId);
    if (syncedEmployeeId) {
      setLoggedInEmployeeId(syncedEmployeeId);
    }
  }, [employee, loggedInEmployeeId, sessionUserId, staff, setLoggedInEmployeeId]);

  useEffect(() => {
    if (!employee || !loggedIn) {
      setEmployeeRuntimeReady(true);
      return undefined;
    }
    const resolvedOrganizationId = resolveClientOrganizationId({ sessionOrganizationId });
    if (!ORG_CONFIG_API_ENABLED || !sessionUserId || !resolvedOrganizationId) {
      setEmployeeRuntimeReady(true);
      return undefined;
    }
    let cancelled = false;
    setEmployeeRuntimeReady(false);
    loadEmployeeRuntimeContextFromApi({
      sessionUserId,
      sessionOrganizationId,
    })
      .then((mapped) => {
        if (cancelled || !mapped) return;
        const businesses = Array.isArray(mapped.configuredBusinesses) ? mapped.configuredBusinesses : [];

        applyOrgConfigMappedState(mapped, {
          setConfiguredBusinesses,
          setArchivedBusinessIds,
          setStoreChannelSettings,
          setStaff,
          setStoreOperationalSettings,
        });

        if (!businesses.length) return;

        let patchedBusinessId = employeeBusinessIdRef.current;
        setStaff((currentStaff) => {
          const patch = patchEmployeeStaffStoreIdsFromHydration({
            staff: currentStaff,
            loggedInEmployeeId,
            sessionUserId,
            configuredBusinesses: businesses,
            employeeBusinessId: patchedBusinessId,
          });
          patchedBusinessId = patch.employeeBusinessId;
          return patch.staff;
        });
        if (patchedBusinessId !== employeeBusinessIdRef.current) {
          setEmployeeBusinessId(patchedBusinessId);
        }
      })
      .catch((error) => {
        if (cancelled) return;
        console.warn("employee runtime hydration failed", error);
      })
      .finally(() => {
        if (!cancelled) setEmployeeRuntimeReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [
    employee,
    loggedIn,
    loggedInEmployeeId,
    sessionOrganizationId,
    sessionUserId,
    setArchivedBusinessIds,
    setConfiguredBusinesses,
    setEmployeeBusinessId,
    setEmployeeRuntimeReady,
    setStaff,
    setStoreChannelSettings,
    setStoreOperationalSettings,
  ]);

  useEffect(() => {
    if (!closeoutsApiEnabled && !entriesApiEnabled) {
      setRuntimeApiIdMaps(null);
      return;
    }
    let envStoreIdMap = {};
    let envUserIdMap = {};
    let envSalesChannelIdMap = {};
    try {
      envStoreIdMap = JSON.parse(process.env.NEXT_PUBLIC_CLOSEOUTS_STORE_ID_MAP || "{}");
      envUserIdMap = JSON.parse(process.env.NEXT_PUBLIC_CLOSEOUTS_USER_ID_MAP || "{}");
      envSalesChannelIdMap = JSON.parse(process.env.NEXT_PUBLIC_CLOSEOUTS_SALES_CHANNEL_ID_MAP || "{}");
    } catch {
      envStoreIdMap = {};
      envUserIdMap = {};
      envSalesChannelIdMap = {};
    }
    const maps = buildRuntimeApiIdMaps({
      configuredBusinesses,
      staff,
      storeChannelSettings,
      envStoreIdMap,
      envUserIdMap,
      envSalesChannelIdMap,
      includeCatalogDefaults: !BINDS_TO_SERVER_AUTH,
    });
    setRuntimeApiIdMaps(patchRuntimeApiMapsForEmployeeSession(maps, {
      employee,
      loggedInEmployeeId,
      sessionUserId,
      uuidChecker: isUuid,
    }));
  }, [
    closeoutsApiEnabled,
    configuredBusinesses,
    employee,
    entriesApiEnabled,
    loggedInEmployeeId,
    sessionUserId,
    staff,
    storeChannelSettings,
  ]);
}
