import { readEmployeeNotebookTheme } from "@/features/employee-closeouts/employee-theme-storage";
import { usesRuntimeSettingsApi } from "@/core/config/runtime-capabilities";
import type {
  AuthActiveBusiness,
  AuthRuntimeApply,
  AuthServerSession,
  AuthStaffMember,
} from "./auth-client-types";
import {
  persistLocalEmployeeSession,
  persistLocalOwnerSession,
} from "./session-bridge";

export type {
  AuthActiveBusiness,
  AuthRuntimeApply,
  AuthServerSession,
  AuthStaffMember,
} from "./auth-client-types";

export function applyOwnerLoginSuccess({
  apiUserId = "",
  organizationId = "",
  displayName = "",
  mustChangePassword = false,
  apply = {},
}: {
  apiUserId?: string;
  organizationId?: string;
  displayName?: string;
  mustChangePassword?: boolean;
  apply?: AuthRuntimeApply;
} = {}) {
  persistLocalOwnerSession();
  const userId = typeof apiUserId === "string" ? apiUserId : "";
  const orgId = typeof organizationId === "string" ? organizationId : "";
  const ownerName = typeof displayName === "string" ? displayName.trim() : "";
  apply.setSessionUserId?.(userId);
  apply.setSessionOrganizationId?.(orgId);
  apply.setLoggedIn?.(true);
  apply.setEmployee?.(false);
  apply.setLoggedInEmployeeId?.(null);
  apply.setAuthScreen?.("owner");
  apply.setOwnerPage?.("home");
  if (ownerName) {
    apply.setOwnerProfile?.({ name: ownerName });
  }
  apply.setMustChangePassword?.(mustChangePassword === true);
}

export function applyEmployeeLoginSuccess({
  personId,
  apiUserId = "",
  organizationId = "",
  staff = [],
  activeBusinesses = [],
  displayName = "",
  apply = {},
}: {
  personId: string;
  apiUserId?: string;
  organizationId?: string;
  staff?: AuthStaffMember[];
  activeBusinesses?: AuthActiveBusiness[];
  displayName?: string;
  apply?: AuthRuntimeApply;
}) {
  const person = staff.find((item) => item.id === personId && item.active && !item.removed);
  const resolvedEmployeeId = person?.id || (typeof apiUserId === "string" && apiUserId ? apiUserId : personId);
  if (!resolvedEmployeeId) return false;

  persistLocalEmployeeSession({ employeeId: resolvedEmployeeId });
  const userId = typeof apiUserId === "string" ? apiUserId : "";
  const orgId = typeof organizationId === "string" ? organizationId : "";
  const resolvedDisplayName = (typeof displayName === "string" ? displayName.trim() : "")
    || person?.nameAr
    || person?.nameEn
    || "";
  apply.setSessionUserId?.(userId);
  apply.setSessionOrganizationId?.(orgId);
  apply.setSessionDisplayName?.(resolvedDisplayName);
  apply.setLoggedIn?.(true);
  apply.setEmployee?.(true);
  apply.setLoggedInEmployeeId?.(resolvedEmployeeId);
  apply.setEmployeeBusinessId?.(person?.storeIds?.[0] || activeBusinesses[0]?.id || "");
  if (!usesRuntimeSettingsApi()) {
    apply.setEmployeeThemeOverride?.(readEmployeeNotebookTheme(resolvedEmployeeId));
  }
  apply.setEmployeePage?.("closeouts");
  apply.setAuthScreen?.("owner");
  return true;
}

export function applyServerSessionBootstrap(session: AuthServerSession, apply: AuthRuntimeApply = {}) {
  if (!session?.authenticated) return false;

  apply.setSessionOrganizationId?.(typeof session.organizationId === "string" ? session.organizationId : "");
  apply.setSessionUserId?.(typeof session.userId === "string" ? session.userId : "");
  apply.setLoggedIn?.(true);
  apply.setAuthScreen?.("owner");

  if (session.role === "employee") {
    apply.setEmployee?.(true);
    apply.setLoggedInEmployeeId?.(session.userId ?? null);
    apply.setEmployeePage?.("closeouts");
    const employeeName = typeof session.displayName === "string" ? session.displayName.trim() : "";
    if (employeeName) {
      apply.setSessionDisplayName?.(employeeName);
    }
    return true;
  }

  apply.setEmployee?.(false);
  apply.setLoggedInEmployeeId?.(null);
  apply.setSessionDisplayName?.("");
  apply.setOwnerPage?.("home");
  const displayName = typeof session.displayName === "string" ? session.displayName.trim() : "";
  if (displayName) {
    apply.setOwnerProfile?.({ name: displayName });
  }
  apply.setMustChangePassword?.(session.mustChangePassword === true);
  return true;
}

export function applyLogoutReset({
  bindsToServerAuth,
  apply = {},
  nextAuthScreen = "gateway",
}: {
  bindsToServerAuth?: boolean;
  apply?: AuthRuntimeApply;
  nextAuthScreen?: string;
} = {}) {
  apply.setSessionOrganizationId?.("");
  apply.setSessionUserId?.("");
  apply.setLoggedIn?.(false);
  apply.setEmployee?.(false);
  apply.setLoggedInEmployeeId?.(null);
  apply.setAuthScreen?.(nextAuthScreen);
  apply.setEmployeePage?.("closeouts");
  apply.setOwnerPage?.("home");
  apply.setOwnerManageCloseout?.(null);
  apply.setSelected?.(null);
  apply.setVoidTarget?.(null);
  apply.setRestoreTarget?.(null);
  apply.setSavedOutflowShareTarget?.(null);
  apply.setPendingDuplicateSummary?.(null);
  apply.setDuplicateSummaryFocus?.(null);
  apply.setAttachmentReviewRequest?.(null);
  apply.setShareSnapshot?.(null);
  apply.setQuickAddOpen?.(false);
  apply.setArchivedReadOnlyBusinessId?.(null);
  apply.setSelectedBusiness?.("all");

  if (!bindsToServerAuth) return;

  apply.setOperationalEntries?.([]);
  apply.setStaff?.([]);
  apply.setConfiguredBusinesses?.([]);
  apply.setArchivedBusinessIds?.([]);
  apply.setAuthOwnerUsername?.("");
  apply.setAuthOwnerPassword?.("");
  apply.setAuthEmployeePins?.({});
  apply.setOwnerProfile?.({ name: "" });
  apply.setMustChangePassword?.(false);
  apply.setSessionDisplayName?.("");
}
