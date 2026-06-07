import { describe, expect, it } from "vitest";
import {
  employeePinMatches,
  enrichActiveEmployeeWithSessionUserId,
  filterActiveLoginStaff,
  patchRuntimeApiMapsForEmployeeSession,
  resolveActiveEmployee,
  resolveAssignedEmployeeBusinesses,
  resolveCurrentEmployeeBusiness,
  resolveEmployeeBusinessId,
  resolveEmployeeLoginStaff,
  syncLoggedInEmployeeIdFromSession,
} from "./employee-portal-session";

describe("employee-portal-session", () => {
  it("matches employee pin against person or default", () => {
    expect(employeePinMatches({ pin: "4321" }, "4321", "1234")).toBe(true);
    expect(employeePinMatches({}, "1234", "1234")).toBe(true);
    expect(employeePinMatches({ pin: "9999" }, "1234", "1234")).toBe(false);
  });

  it("resolves active employee and enriches api user id from session", () => {
    const employee = resolveActiveEmployee({
      employee: true,
      loggedInEmployeeId: "staff-1",
      staff: [{ id: "staff-1", active: true, removed: false, storeIds: ["b1"] }],
      sessionUserId: "acb24f1e-bf77-48d7-ba01-1e77d2c8c713",
      uuidChecker: (value) => value.startsWith("acb"),
    });
    expect(employee?.id).toBe("staff-1");
    expect(employee?.apiUserId).toBe("acb24f1e-bf77-48d7-ba01-1e77d2c8c713");
  });

  it("keeps existing api user id on active employee", () => {
    const enriched = enrichActiveEmployeeWithSessionUserId(
      { id: "staff-1", apiUserId: "existing-uuid" },
      "session-uuid",
      () => true,
    );
    expect(enriched?.apiUserId).toBe("existing-uuid");
  });

  it("resolves assigned businesses and current store selection", () => {
    const businesses = [
      { id: "b1", nameAr: "A" },
      { id: "b2", nameAr: "B" },
    ];
    const employee = { storeIds: ["b2"] };
    const assigned = resolveAssignedEmployeeBusinesses(businesses, employee);
    expect(assigned).toHaveLength(1);
    expect(resolveCurrentEmployeeBusiness(assigned, "missing")?.id).toBe("b2");
    expect(resolveEmployeeBusinessId(assigned, "missing")).toBe("b2");
  });

  it("syncs logged in employee id from session staff match", () => {
    const synced = syncLoggedInEmployeeIdFromSession(
      [{ id: "staff-2", apiUserId: "uuid-2" }],
      "uuid-2",
      "legacy-id",
    );
    expect(synced).toBe("staff-2");
  });

  it("patches runtime api maps for employee session", () => {
    const patched = patchRuntimeApiMapsForEmployeeSession(
      { userIdMap: { ahmed: "old" } },
      {
        employee: true,
        loggedInEmployeeId: "staff-1",
        sessionUserId: "acb24f1e-bf77-48d7-ba01-1e77d2c8c713",
        uuidChecker: (value) => value.startsWith("acb"),
      },
    );
    expect(patched.userIdMap["staff-1"]).toBe("acb24f1e-bf77-48d7-ba01-1e77d2c8c713");
    expect(patched.userIdMap.ahmed).toBe("old");
  });

  it("resolves login staff from roster fallback in production mode", () => {
    const loginStaff = resolveEmployeeLoginStaff(
      [{ id: "local", active: false, removed: false }],
      [{ id: "api-1", active: true, removed: false }],
      true,
    );
    expect(loginStaff).toHaveLength(1);
    expect(loginStaff[0].id).toBe("api-1");
    expect(filterActiveLoginStaff(loginStaff)).toHaveLength(1);
  });
});
