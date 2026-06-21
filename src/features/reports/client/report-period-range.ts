export function resolveReportDateRange({
  period = "day",
  selectedDate = "",
  selectedMonth = "",
  selectedYear = "",
  customFrom = "",
  customTo = "",
}) {
  if (period === "month" && selectedMonth) {
    const [yearText, monthText] = selectedMonth.split("-");
    const year = Number(yearText);
    const monthIndex = Number(monthText);
    const lastDay = new Date(year, monthIndex, 0).getDate();
    return {
      from: `${yearText}-${monthText}-01`,
      to: `${yearText}-${monthText}-${String(lastDay).padStart(2, "0")}`,
    };
  }
  if (period === "year" && selectedYear) {
    return {
      from: `${selectedYear}-01-01`,
      to: `${selectedYear}-12-31`,
    };
  }
  if (period === "custom" && customFrom && customTo) {
    return { from: customFrom, to: customTo };
  }
  const date = selectedDate || new Date().toISOString().slice(0, 10);
  return { from: date, to: date };
}
