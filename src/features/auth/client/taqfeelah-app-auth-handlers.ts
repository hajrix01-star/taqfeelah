import {
  applyEmployeeLoginSuccess,
  applyLogoutReset,
  applyOwnerLoginSuccess,
} from "@/features/auth/client/auth-runtime-orchestrator";
import type { AuthActiveBusiness, AuthRuntimeApply, AuthStaffMember } from "@/features/auth/client/auth-client-types";
import { upsertRuntimeEmployeeRosterStaff } from "@/features/employee-closeouts/employee-portal-session";
import { logoutViaSessionBridge } from "@/features/auth/client/session-bridge";
import {
  APP_IN_PRODUCTION_MODE,
  BINDS_TO_SERVER_AUTH,
} from "@/components/taqfeelah-app/taqfeelah-app-boot";

export type TaqfeelahAppAuthHandlerDeps = AuthRuntimeApply & {
  staff: AuthStaffMember[];
  activeBusinesses: AuthActiveBusiness[];
};

export function createTaqfeelahAppAuthHandlers({
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
  setSessionDisplayName,
}: TaqfeelahAppAuthHandlerDeps) {
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

  const completeEmployeeLogin = (
    personId: string,
    apiUserId = "",
    rosterPerson: AuthStaffMember | null = null,
    organizationId = "",
  ) => {
    const displayName = rosterPerson?.nameAr || rosterPerson?.nameEn || "";
    let resolvedRoster: AuthStaffMember | null = rosterPerson;
    if (!resolvedRoster && displayName && apiUserId) {
      resolvedRoster = {
        id: personId || apiUserId,
        apiUserId,
        nameAr: displayName,
        nameEn: displayName,
        active: true,
        removed: false,
        storeIds: [],
      };
    }
    const loginStaff = resolvedRoster
      ? upsertRuntimeEmployeeRosterStaff(staff, resolvedRoster) as AuthStaffMember[]
      : staff;
    if (resolvedRoster) {
      setStaff?.((current) => upsertRuntimeEmployeeRosterStaff(current, resolvedRoster) as AuthStaffMember[]);
    }
    applyEmployeeLoginSuccess({
      personId,
      apiUserId,
      organizationId,
      displayName,
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
        setSessionDisplayName,
      },
    });
  };

  const logout = async ({ nextAuthScreen = "gateway" }: { nextAuthScreen?: string } = {}) => {
    try {
      await logoutViaSessionBridge({ useServerAuth: APP_IN_PRODUCTION_MODE });
    } catch (error) {
      console.warn("logout api failed", error);
    }
    applyLogoutReset({
      bindsToServerAuth: BINDS_TO_SERVER_AUTH,
      nextAuthScreen,
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

  const switchPortal = async (target: string) => {
    const nextAuthScreen = target === "employee" ? "employee" : "owner";
    await logout({ nextAuthScreen });
  };

  return {
    completeOwnerLogin,
    completeEmployeeLogin,
    logout,
    switchPortal,
  };
}
