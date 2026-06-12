import {
  applyEmployeeLoginSuccess,
  applyLogoutReset,
  applyOwnerLoginSuccess,
} from "@/features/auth/client/auth-runtime-orchestrator";
import { upsertPrototypeEmployeeRosterStaff } from "@/features/employee-closeouts/employee-portal-session";
import { logoutViaSessionBridge } from "@/features/auth/client/session-bridge";
import { readPrototypeAccessAuthContext } from "@/core/client/prototype-access-auth-context";
import {
  APP_IN_PRODUCTION_MODE,
  BINDS_TO_SERVER_AUTH,
  PROTOTYPE_ACCESS_MODE,
  PROTOTYPE_DEFAULT_STAFF,
} from "@/components/prototype-runtime/prototype-runtime-boot";

export function createPrototypeRuntimeAuthHandlers({
  staff,
  setStaff,
  activeBusinesses,
  setSessionOrganizationId,
  setSessionUserId,
  setLoggedIn,
  setEmployee,
  setLoggedInEmployeeId,
  setAuthScreen,
  setEmployeeBusinessId,
  setEmployeeThemeOverride,
  setEmployeePage,
  setOwnerPage,
  setOwnerManageCloseout,
  setSelected,
  setVoidTarget,
  setRestoreTarget,
  setSavedOutflowShareTarget,
  setPendingDuplicateSummary,
  setDuplicateSummaryFocus,
  setAttachmentReviewRequest,
  setShareSnapshot,
  setQuickAddOpen,
  setArchivedReadOnlyBusinessId,
  setSelectedBusiness,
  setOperationalEntries,
  setConfiguredBusinesses,
  setArchivedBusinessIds,
  setAuthOwnerUsername,
  setAuthOwnerPassword,
  setAuthEmployeePins,
  setOwnerProfile,
  setMustChangePassword,
}) {
  const completeOwnerLogin = (
    apiUserId = "",
    organizationId = "",
    displayName = "",
    mustChangePassword = false,
  ) => {
    applyOwnerLoginSuccess({
      apiUserId,
      organizationId,
      displayName,
      mustChangePassword,
      prototypeAccessMode: PROTOTYPE_ACCESS_MODE,
      apply: {
        setSessionOrganizationId,
        setSessionUserId,
        setLoggedIn,
        setEmployee,
        setLoggedInEmployeeId,
        setAuthScreen,
        setOwnerPage,
        setOwnerProfile,
        setMustChangePassword,
      },
    });

    if (typeof window !== "undefined") {
      const nextPath = new URLSearchParams(window.location.search).get("next");
      if (nextPath && nextPath.startsWith("/saas-admin")) {
        window.location.assign(nextPath);
      }
    }
  };

  const completeEmployeeLogin = (personId, apiUserId = "", rosterPerson = null, organizationId = "") => {
    const loginStaff = rosterPerson
      ? upsertPrototypeEmployeeRosterStaff(staff, rosterPerson)
      : staff;
    if (rosterPerson) {
      setStaff((current) => upsertPrototypeEmployeeRosterStaff(current, rosterPerson));
    }
    applyEmployeeLoginSuccess({
      personId,
      apiUserId,
      organizationId,
      staff: loginStaff,
      activeBusinesses,
      prototypeAccessMode: PROTOTYPE_ACCESS_MODE,
      apply: {
        setSessionOrganizationId,
        setSessionUserId,
        setLoggedIn,
        setEmployee,
        setLoggedInEmployeeId,
        setEmployeeBusinessId,
        setEmployeeThemeOverride,
        setEmployeePage,
        setAuthScreen,
      },
    });
  };

  const logout = async () => {
    try {
      await logoutViaSessionBridge({ useServerAuth: APP_IN_PRODUCTION_MODE });
    } catch (error) {
      console.warn("logout api failed", error);
    }
    applyLogoutReset({
      bindsToServerAuth: BINDS_TO_SERVER_AUTH,
      apply: {
        setSessionOrganizationId,
        setSessionUserId,
        setLoggedIn,
        setEmployee,
        setLoggedInEmployeeId,
        setAuthScreen,
        setEmployeePage,
        setOwnerPage,
        setOwnerManageCloseout,
        setSelected,
        setVoidTarget,
        setRestoreTarget,
        setSavedOutflowShareTarget,
        setPendingDuplicateSummary,
        setDuplicateSummaryFocus,
        setAttachmentReviewRequest,
        setShareSnapshot,
        setQuickAddOpen,
        setArchivedReadOnlyBusinessId,
        setSelectedBusiness,
        setOperationalEntries,
        setStaff,
        setConfiguredBusinesses,
        setArchivedBusinessIds,
        setAuthOwnerUsername,
        setAuthOwnerPassword,
        setAuthEmployeePins,
        setOwnerProfile,
      },
    });
  };

  const enterPrototypeAsEmployee = () => {
    const { organizationId, defaultEmployeeLegacyId, defaultEmployeeUserId } = readPrototypeAccessAuthContext();
    const person = staff.find((item) => item.active && !item.removed)
      || (defaultEmployeeUserId
        ? {
          id: defaultEmployeeUserId,
          apiUserId: defaultEmployeeUserId,
          legacyId: defaultEmployeeLegacyId,
          active: true,
          removed: false,
          storeIds: [],
        }
        : null)
      || PROTOTYPE_DEFAULT_STAFF[0];
    if (!person?.id) return;
    completeEmployeeLogin(
      person.id,
      person.apiUserId || defaultEmployeeUserId || "",
      person,
      organizationId,
    );
  };

  const enterPrototypeAsOwner = () => {
    const { organizationId, ownerUserId } = readPrototypeAccessAuthContext();
    completeOwnerLogin(ownerUserId, organizationId);
  };

  return {
    completeOwnerLogin,
    completeEmployeeLogin,
    logout,
    enterPrototypeAsEmployee,
    enterPrototypeAsOwner,
  };
}
