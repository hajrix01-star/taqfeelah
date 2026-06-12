import {
  applyEmployeeLoginSuccess,
  applyLogoutReset,
  applyOwnerLoginSuccess,
} from "@/features/auth/client/auth-runtime-orchestrator";
import { upsertPrototypeEmployeeRosterStaff } from "@/features/employee-closeouts/employee-portal-session";
import { logoutViaSessionBridge } from "@/features/auth/client/session-bridge";
import {
  APP_IN_PRODUCTION_MODE,
  BINDS_TO_SERVER_AUTH,
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

  return {
    completeOwnerLogin,
    completeEmployeeLogin,
    logout,
  };
}
