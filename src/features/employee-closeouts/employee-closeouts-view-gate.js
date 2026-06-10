/** @param {{ employeeRuntimeReady?: boolean, currentStore?: object | null }} input */
export function resolveEmployeeCloseoutsViewGate({
  employeeRuntimeReady = true,
  currentStore = null,
} = {}) {
  if (!employeeRuntimeReady) return "loading";
  if (!currentStore) return "no-store";
  return "ready";
}
