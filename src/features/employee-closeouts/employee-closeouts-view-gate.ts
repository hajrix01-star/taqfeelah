import type { EmployeeCloseoutsViewGate } from "./employee-closeouts-types";
import type { StoreRef } from "@/features/daily-closeouts/daily-closeouts-types";

export function resolveEmployeeCloseoutsViewGate({
  employeeRuntimeReady = true,
  currentStore = null,
  assignedStores = [],
}: {
  employeeRuntimeReady?: boolean;
  currentStore?: StoreRef | null;
  assignedStores?: StoreRef[];
} = {}): EmployeeCloseoutsViewGate {
  if (!employeeRuntimeReady) return "loading";
  if (!currentStore && assignedStores.length === 0) return "no-store";
  return "ready";
}
