import { readEmployeeNotebookTheme } from "@/features/employee-closeouts/employee-theme-storage";
import { usesRuntimeSettingsApi } from "@/core/config/runtime-capabilities";
import {
  persistLocalEmployeeSession,
  persistLocalOwnerSession,
} from "./session-bridge";

/**
 * @typedef {Object} AuthRuntimeApply
 * @property {(value: string) => void} [setSessionUserId]
 * @property {(value: string) => void} [setSessionOrganizationId]
 * @property {(value: boolean) => void} [setLoggedIn]
 * @property {(value: boolean) => void} [setEmployee]
 * @property {(value: string | null) => void} [setLoggedInEmployeeId]
 * @property {(value: string) => void} [setAuthScreen]
 * @property {(value: string) => void} [setOwnerPage]
 * @property {(value: string) => void} [setEmployeePage]
 * @property {(value: string) => void} [setEmployeeBusinessId]
 * @property {(value: unknown) => void} [setEmployeeThemeOverride]
 * @property {(value: unknown[]) => void} [setOperationalEntries]
 * @property {(value: unknown[]) => void} [setStaff]
 * @property {(value: unknown[]) => void} [setConfiguredBusinesses]
 * @property {(value: string[]) => void} [setArchivedBusinessIds]
 * @property {(value: string) => void} [setAuthOwnerUsername]
 * @property {(value: string) => void} [setAuthOwnerPassword]
 * @property {(value: Record<string, string>) => void} [setAuthEmployeePins]
 * @property {(value: { name: string }) => void} [setOwnerProfile]
 * @property {(value: boolean) => void} [setMustChangePassword]
 * @property {(value: string) => void} [setSessionDisplayName]
 * @property {(value: unknown) => void} [setOwnerManageCloseout]
 * @property {(value: unknown) => void} [setSelected]
 * @property {(value: unknown) => void} [setVoidTarget]
 * @property {(value: unknown) => void} [setRestoreTarget]
 * @property {(value: unknown) => void} [setSavedOutflowShareTarget]
 * @property {(value: unknown) => void} [setPendingDuplicateSummary]
 * @property {(value: unknown) => void} [setDuplicateSummaryFocus]
 * @property {(value: unknown) => void} [setAttachmentReviewRequest]
 * @property {(value: unknown) => void} [setShareSnapshot]
 * @property {(value: boolean) => void} [setQuickAddOpen]
 * @property {(value: string | null) => void} [setArchivedReadOnlyBusinessId]
 * @property {(value: string) => void} [setSelectedBusiness]
 */

export function applyOwnerLoginSuccess({
  apiUserId = "",
  organizationId = "",
  displayName = "",
  mustChangePassword = false,
  apply = {},
}) {
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

/**
 * @param {Object} input
 * @param {string} input.personId
 * @param {string} [input.apiUserId]
 * @param {string} [input.organizationId]
 * @param {Array<{ id?: string, active?: boolean, removed?: boolean, storeIds?: string[] }>} [input.staff]
 * @param {Array<{ id?: string }>} [input.activeBusinesses]
 * @param {AuthRuntimeApply} [input.apply]
 */
export function applyEmployeeLoginSuccess({
  personId,
  apiUserId = "",
  organizationId = "",
  staff = [],
  activeBusinesses = [],
  displayName = "",
  apply = {},
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

export function applyServerSessionBootstrap(session, apply = {}) {
  if (!session?.authenticated) return false;

  apply.setSessionOrganizationId?.(typeof session.organizationId === "string" ? session.organizationId : "");
  apply.setSessionUserId?.(typeof session.userId === "string" ? session.userId : "");
  apply.setLoggedIn?.(true);
  apply.setAuthScreen?.("owner");

  if (session.role === "employee") {
    apply.setEmployee?.(true);
    apply.setLoggedInEmployeeId?.(session.userId);
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

export function applyLogoutReset({ bindsToServerAuth, apply = {}, nextAuthScreen = "gateway" }) {
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
