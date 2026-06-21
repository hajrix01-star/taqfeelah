import type { OperationalEntry } from "@/features/entries/client/entries-client-types";
import type {
  CloseoutAlertItem,
  OwnerShellApplyHandlers,
  OwnerShellNotificationInput,
} from "@/features/owner-shell/client/owner-shell-client-types";

export function resetOwnerNavContext(apply: OwnerShellApplyHandlers): void {
  apply.setArchivedReadOnlyBusinessId?.(null);
  apply.setDuplicateSummaryFocus?.(null);
  apply.setSelectedBusiness?.("all");
}

export function navigateOwnerPage(page: string, apply: OwnerShellApplyHandlers): void {
  resetOwnerNavContext(apply);
  apply.setOwnerPage?.(page === "reports" ? "home" : page);
}

export function openOwnerQuickSummary(apply: OwnerShellApplyHandlers): void {
  apply.setQuickAddOpen?.(false);
  apply.setOwnerPage?.("add-summary");
}

export function openOwnerQuickExpense(apply: OwnerShellApplyHandlers): void {
  apply.setQuickAddOpen?.(false);
  apply.setOwnerPage?.("add-expense");
}

export function openDuplicateSummaryInRegister(
  alert: CloseoutAlertItem | null | undefined,
  apply: OwnerShellApplyHandlers,
): void {
  if (!alert?.businessId || !alert?.date) return;
  apply.setArchivedReadOnlyBusinessId?.(null);
  apply.setSelectedBusiness?.(alert.businessId);
  apply.setDuplicateSummaryFocus?.({
    businessId: alert.businessId,
    date: alert.date,
    openedAt: Date.now(),
  });
  apply.setOwnerPage?.("register");
}

export function openCloseoutAlertInRegister(
  alert: CloseoutAlertItem | null | undefined,
  apply: OwnerShellApplyHandlers,
  operationalEntries: OperationalEntry[] = [],
): void {
  if (!alert?.businessId || !alert?.date) return;
  apply.setArchivedReadOnlyBusinessId?.(null);
  apply.setSelectedBusiness?.(alert.businessId);
  apply.setOwnerPage?.("register");
  if (alert.entryId) {
    apply.setSelected?.(operationalEntries.find((entry) => entry.id === alert.entryId) || null);
  }
  apply.setCloseoutAlerts?.((current) => current.map(
    (item) => (item.id === alert.id ? { ...item, seen: true } : item),
  ));
}

export function dismissCloseoutAlertRecord(alertId: string, apply: OwnerShellApplyHandlers): void {
  apply.setCloseoutAlerts?.((current) => current.map(
    (item) => (item.id === alertId ? { ...item, seen: true } : item),
  ));
}

export function handleOwnerNotificationsClick({
  unseenCloseoutAlerts,
  apply,
}: OwnerShellNotificationInput): void {
  apply.setArchivedReadOnlyBusinessId?.(null);
  if (unseenCloseoutAlerts[0]) {
    openCloseoutAlertInRegister(unseenCloseoutAlerts[0], apply);
  }
}
