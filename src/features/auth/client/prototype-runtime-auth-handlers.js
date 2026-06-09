import {
  applyEmployeeLoginSuccess,
  applyLogoutReset,
  applyOwnerLoginSuccess,
} from "@/features/auth/client/auth-runtime-orchestrator";
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
  setOwnerReviewCloseout,
  setReturnCloseoutTarget,
  setSelected,
  setVoidTarget,
  setRestoreTarget,
  setSavedOutflowShareTarget,
  setPendingDuplicateSummary,
  setDuplicateReviewFocus,
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
}) {
  const completeOwnerLogin = (apiUserId = "", organizationId = "") => {
    applyOwnerLoginSuccess({
      apiUserId,
      organizationId,
      prototypeAccessMode: PROTOTYPE_ACCESS_MODE,
      apply: {
        setSessionOrganizationId,
        setSessionUserId,
        setLoggedIn,
        setEmployee,
        setLoggedInEmployeeId,
        setAuthScreen,
        setOwnerPage,
      },
    });
  };

  const completeEmployeeLogin = (personId, apiUserId = "", rosterPerson = null, organizationId = "") => {
    const loginStaff = rosterPerson && !staff.some((person) => person.id === rosterPerson.id)
      ? [rosterPerson, ...staff]
      : staff;
    if (rosterPerson) {
      setStaff((current) => (
        current.some((person) => person.id === rosterPerson.id)
          ? current
          : [rosterPerson, ...current]
      ));
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
        setOwnerReviewCloseout,
        setReturnCloseoutTarget,
        setSelected,
        setVoidTarget,
        setRestoreTarget,
        setSavedOutflowShareTarget,
        setPendingDuplicateSummary,
        setDuplicateReviewFocus,
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
