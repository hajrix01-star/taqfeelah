import { describe, expect, it } from "vitest";
import { resolveEmployeeCloseoutsViewGate } from "./employee-closeouts-view-gate";

describe("resolveEmployeeCloseoutsViewGate", () => {
  it("shows loading before hydration even when currentStore is missing", () => {
    expect(resolveEmployeeCloseoutsViewGate({
      employeeRuntimeReady: false,
      currentStore: null,
    })).toBe("loading");
  });

  it("shows no-store only after hydration completes without a linked store", () => {
    expect(resolveEmployeeCloseoutsViewGate({
      employeeRuntimeReady: true,
      currentStore: null,
    })).toBe("no-store");
  });

  it("is ready when hydration completed and store exists", () => {
    expect(resolveEmployeeCloseoutsViewGate({
      employeeRuntimeReady: true,
      currentStore: { id: "store-1" },
    })).toBe("ready");
  });
});
