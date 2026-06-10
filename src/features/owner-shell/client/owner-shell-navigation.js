export function resetOwnerNavContext(apply) {
  apply.setArchivedReadOnlyBusinessId?.(null);
  apply.setDuplicateSummaryFocus?.(null);
  apply.setSelectedBusiness?.("all");
}

export function navigateOwnerPage(page, apply) {
  resetOwnerNavContext(apply);
  apply.setOwnerPage?.(page === "reports" ? "home" : page);
}

export function openOwnerQuickSummary(apply) {
  apply.setQuickAddOpen?.(false);
  apply.setOwnerPage?.("add-summary");
}

export function openOwnerQuickExpense(apply) {
  apply.setQuickAddOpen?.(false);
  apply.setOwnerPage?.("add-expense");
}

export function openDuplicateSummaryInRegister(alert, apply) {
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

export function openCloseoutAlertInRegister(alert, apply, operationalEntries = []) {
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

export function dismissCloseoutAlertRecord(alertId, apply) {
  apply.setCloseoutAlerts?.((current) => current.map(
    (item) => (item.id === alertId ? { ...item, seen: true } : item),
  ));
}

export function handleOwnerNotificationsClick({
  duplicateSalesAlerts,
  unseenCloseoutAlerts,
  apply,
}) {
  apply.setArchivedReadOnlyBusinessId?.(null);
  if (duplicateSalesAlerts.length > 0) {
    openDuplicateSummaryInRegister(duplicateSalesAlerts[0], apply);
    return;
  }
  if (unseenCloseoutAlerts[0]) {
    openCloseoutAlertInRegister(unseenCloseoutAlerts[0], apply);
  }
}
