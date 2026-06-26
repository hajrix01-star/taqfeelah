import { describe, expect, it } from "vitest";
import {
  employeePinMatches,
  enrichActiveEmployeeWithSessionUserId,
  filterActiveLoginStaff,
  patchEmployeeStaffStoreIdsFromHydration,
  patchRuntimeApiMapsForEmployeeSession,
  upsertRuntimeEmployeeRosterStaff,
  resolveActiveEmployee,
  resolveAssignedEmployeeBusinesses,
  resolveCurrentEmployeeBusiness,
  resolveEmployeeDisplayName,
  resolveEmployeeBusinessId,
  resolveEmployeeLoginStaff,
  synthesizeEmployeeBusinessesFromStoreIds,
  syncLoggedInEmployeeIdFromSession,
} from "./employee-portal-session";

describe("employee-portal-session", () => {
  it("matches employee pin against person or default", () => {
    expect(employeePinMatches({ pin: "4321" }, "4321", "1234")).toBe(true);
    expect(employeePinMatches({}, "1234", "1234")).toBe(true);
    expect(employeePinMatches({ pin: "9999" }, "1234", "1234")).toBe(false);
  });

  it("resolves localized employee display name with fallback", () => {
    expect(resolveEmployeeDisplayName({ nameAr: "أحمد", nameEn: "Ahmed" }, "ar")).toBe("أحمد");
    expect(resolveEmployeeDisplayName({ nameAr: "أحمد", nameEn: "Ahmed" }, "en")).toBe("Ahmed");
    expect(resolveEmployeeDisplayName(null, "ar", "G")).toBe("G");
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
    const employee = { id: "e1", storeIds: ["b2"] };
    const assigned = resolveAssignedEmployeeBusinesses(businesses, employee);
    expect(assigned).toHaveLength(1);
    expect(resolveCurrentEmployeeBusiness(assigned, "missing")?.id).toBe("b2");
    expect(resolveEmployeeBusinessId(assigned, "missing")).toBe("b2");
  });

  it("matches assigned businesses by db store id and legacy id", () => {
    const businesses = [
      { id: "shami", dbStoreId: "store-uuid-1", nameAr: "A" },
      { id: "arz", legacyId: "store-uuid-2", nameAr: "B" },
    ];
    const employee = { id: "e1", storeIds: ["store-uuid-1", "store-uuid-2"] };
    const assigned = resolveAssignedEmployeeBusinesses(businesses, employee);
    expect(assigned.map((business) => business.id)).toEqual(["shami", "arz"]);
  });

  it("synthesizes placeholder businesses from roster store ids", () => {
    const placeholders = synthesizeEmployeeBusinessesFromStoreIds([
      "11111111-1111-4111-8111-111111111111",
    ]);
    expect(placeholders).toHaveLength(1);
    expect(placeholders[0].id).toBe("11111111-1111-4111-8111-111111111111");
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
    expect(patched.userIdMap?.["staff-1"]).toBe("acb24f1e-bf77-48d7-ba01-1e77d2c8c713");
    expect(patched.userIdMap?.ahmed).toBe("old");
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

  it("backfills missing storeIds from hydrated configured businesses", () => {
    const storeUuid = "11111111-1111-4111-8111-111111111111";
    const employeeUuid = "22222222-2222-4222-8222-222222222222";
    const staff = [{
      id: employeeUuid,
      apiUserId: employeeUuid,
      legacyId: "ahmed",
      active: true,
      removed: false,
      storeIds: [],
    }];
    const configuredBusinesses = [{
      id: storeUuid,
      dbStoreId: storeUuid,
      nameAr: "محل",
      nameEn: "Store",
      displayName: "Store",
    }];

    const patch = patchEmployeeStaffStoreIdsFromHydration({
      staff,
      loggedInEmployeeId: employeeUuid,
      sessionUserId: employeeUuid,
      configuredBusinesses,
      employeeBusinessId: "",
    });

    expect(patch.staff[0].storeIds).toEqual([storeUuid]);
    expect(patch.employeeBusinessId).toBe(storeUuid);
  });

  it("keeps existing storeIds when roster already has store assignments", () => {
    const storeUuid = "11111111-1111-4111-8111-111111111111";
    const employeeUuid = "22222222-2222-4222-8222-222222222222";
    const staff = [{
      id: employeeUuid,
      apiUserId: employeeUuid,
      active: true,
      removed: false,
      storeIds: [storeUuid],
    }];

    const patch = patchEmployeeStaffStoreIdsFromHydration({
      staff,
      loggedInEmployeeId: employeeUuid,
      sessionUserId: employeeUuid,
      configuredBusinesses: [{ id: storeUuid }],
      employeeBusinessId: storeUuid,
    });

    expect(patch.staff).toBe(staff);
    expect(patch.employeeBusinessId).toBe(storeUuid);
  });

  it("upserts employee roster row when staff is initially empty", () => {
    const storeUuid = "11111111-1111-4111-8111-111111111111";
    const employeeUuid = "22222222-2222-4222-8222-222222222222";

    const patch = patchEmployeeStaffStoreIdsFromHydration({
      staff: [],
      loggedInEmployeeId: employeeUuid,
      sessionUserId: employeeUuid,
      configuredBusinesses: [{ id: storeUuid }],
      employeeBusinessId: "",
    });

    expect(patch.staff).toHaveLength(1);
    expect(patch.staff[0].storeIds).toEqual([storeUuid]);
    expect(patch.employeeBusinessId).toBe(storeUuid);
  });

  it("replaces legacy storeIds that do not match hydrated businesses", () => {
    const storeUuid = "11111111-1111-4111-8111-111111111111";
    const employeeUuid = "22222222-2222-4222-8222-222222222222";
    const staff = [{
      id: employeeUuid,
      apiUserId: employeeUuid,
      active: true,
      removed: false,
      storeIds: ["shami"],
    }];

    const patch = patchEmployeeStaffStoreIdsFromHydration({
      staff,
      loggedInEmployeeId: employeeUuid,
      sessionUserId: employeeUuid,
      configuredBusinesses: [{ id: storeUuid }],
      employeeBusinessId: "",
    });

    expect(patch.staff[0].storeIds).toEqual([storeUuid]);
    expect(patch.employeeBusinessId).toBe(storeUuid);
  });

  it("reactivates and merges existing roster row on local employee login", () => {
    const employeeUuid = "22222222-2222-4222-8222-222222222222";
    const staff = [{
      id: employeeUuid,
      apiUserId: employeeUuid,
      active: false,
      removed: true,
      storeIds: [],
    }];
    const rosterPerson = {
      id: employeeUuid,
      apiUserId: employeeUuid,
      legacyId: "ahmed",
      active: true,
      removed: false,
      storeIds: [],
    };

    const merged = upsertRuntimeEmployeeRosterStaff(staff, rosterPerson);

    expect(merged).toHaveLength(1);
    expect(merged[0].active).toBe(true);
    expect(merged[0].removed).toBe(false);
    expect(merged[0]).toMatchObject({ legacyId: "ahmed" });
  });
});
