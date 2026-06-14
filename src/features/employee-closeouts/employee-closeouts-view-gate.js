/** @param {{ employeeRuntimeReady?: boolean, currentStore?: object | null, assignedStores?: object[] }} input */
export function resolveEmployeeCloseoutsViewGate({
  employeeRuntimeReady = true,
  currentStore = null,
  assignedStores = [],
} = {}) {
  if (!employeeRuntimeReady) return "loading";
  if (!currentStore && assignedStores.length === 0) return "no-store";
  return "ready";
}
