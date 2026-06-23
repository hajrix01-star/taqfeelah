export function buildRegisterAutoLoadContextKey({
  safeBusinessId,
  period,
  selectedDate,
  selectedMonth,
  selectedYear,
  customFrom,
  customTo,
}: {
  safeBusinessId: string;
  period: string;
  selectedDate: string;
  selectedMonth: string;
  selectedYear: string;
  customFrom: string;
  customTo: string;
}) {
  return [
    safeBusinessId,
    period,
    selectedDate,
    selectedMonth,
    selectedYear,
    customFrom,
    customTo,
  ].join("|");
}

export function shouldRunRegisterAutoLoadOnce(
  lastLoadedKey: string,
  currentKey: string,
) {
  return lastLoadedKey !== currentKey;
}