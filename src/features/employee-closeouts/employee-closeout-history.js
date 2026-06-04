/** Owner-controlled window for which past closeouts an employee may view. */

export const EMPLOYEE_HISTORY_VISIBILITY = {
  week: "week",
  month: "month",
  all: "all",
};

export function todayIsoDate() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function addDaysIso(isoDate, deltaDays) {
  const date = new Date(`${isoDate}T12:00:00`);
  date.setDate(date.getDate() + deltaDays);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/** Inclusive cutoff date (YYYY-MM-DD): closeouts on or after this date are visible. */
export function employeeHistoryCutoffDate(visibility, todayIso = todayIsoDate()) {
  if (visibility === EMPLOYEE_HISTORY_VISIBILITY.week) return addDaysIso(todayIso, -6);
  if (visibility === EMPLOYEE_HISTORY_VISIBILITY.month) return addDaysIso(todayIso, -29);
  return null;
}

export function isCloseoutWithinEmployeeHistory(closeout, visibility, todayIso = todayIsoDate()) {
  if (!closeout?.date || visibility === EMPLOYEE_HISTORY_VISIBILITY.all || !visibility) return true;
  const cutoff = employeeHistoryCutoffDate(visibility, todayIso);
  if (!cutoff) return true;
  return closeout.date >= cutoff;
}

export function isEntryDateWithinEmployeeHistory(entryDate, visibility, todayIso = todayIsoDate()) {
  if (!entryDate || visibility === EMPLOYEE_HISTORY_VISIBILITY.all || !visibility) return true;
  const cutoff = employeeHistoryCutoffDate(visibility, todayIso);
  if (!cutoff) return true;
  return entryDate >= cutoff;
}

/** Match closeouts opened or submitted by this employee (legacy rows may lack openedByUserId). */
export function closeoutBelongsToEmployee(closeout, employee) {
  if (!closeout || !employee) return false;
  const employeeId = typeof employee === "string" ? employee : employee.id;
  if (employeeId && (closeout.openedByUserId === employeeId || closeout.submittedByUserId === employeeId)) return true;

  // Legacy prototype rows may miss user IDs; fall back to employee name matching.
  const candidateNames = typeof employee === "object"
    ? [employee.nameAr, employee.nameEn]
    : [];
  const actorNames = [closeout.openedByName, closeout.submittedByName];
  const normalize = (value) => String(value || "").trim().toLowerCase();
  const normalizedActors = new Set(actorNames.map(normalize).filter(Boolean));
  return candidateNames.some((name) => normalizedActors.has(normalize(name)));
}

export function employeeHistoryVisibilityLabel(visibility, lang = "ar") {
  if (visibility === EMPLOYEE_HISTORY_VISIBILITY.week) return lang === "ar" ? "أسبوع" : "Week";
  if (visibility === EMPLOYEE_HISTORY_VISIBILITY.month) return lang === "ar" ? "شهر" : "Month";
  return lang === "ar" ? "الكل" : "All";
}
