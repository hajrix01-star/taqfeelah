import { describe, expect, it, vi } from "vitest";
import { buildPrototypeDefaultStaff, readPrototypeAuthBoot } from "./prototype-auth-boot";

describe("prototype auth boot", () => {
  it("builds default demo staff with provided pin", () => {
    const staff = buildPrototypeDefaultStaff("9999");
    expect(staff).toHaveLength(2);
    expect(staff[0]?.pin).toBe("9999");
    expect(staff[1]?.storeIds).toContain("arz");
  });

  it("returns logged-out boot when server auth is not active", () => {
    expect(readPrototypeAuthBoot({
      bindsToServerAuth: false,
    })).toEqual({
      loggedIn: false,
      employee: false,
      loggedInEmployeeId: null,
      employeeBusinessId: "",
    });
  });

  it("resolves auth state from saved settings staff when server auth is active", () => {
    const resolveAuthState = vi.fn(() => ({
      loggedIn: true,
      employee: true,
      loggedInEmployeeId: "ahmed",
      employeeBusinessId: "shami",
    }));

    const boot = readPrototypeAuthBoot({
      bindsToServerAuth: true,
      readSavedSettings: () => ({ staff: [{ id: "ahmed", active: true, storeIds: ["shami"] }] }),
      resolveAuthState,
    });

    expect(resolveAuthState).toHaveBeenCalledWith([{ id: "ahmed", active: true, storeIds: ["shami"] }]);
    expect(boot.loggedInEmployeeId).toBe("ahmed");
  });

  it("uses empty staff list when server auth boots without saved staff", () => {
    const resolveAuthState = vi.fn(() => ({
      loggedIn: false,
      employee: false,
      loggedInEmployeeId: null,
      employeeBusinessId: "",
    }));

    readPrototypeAuthBoot({
      bindsToServerAuth: true,
      readSavedSettings: () => null,
      defaultStaff: [],
      resolveAuthState,
    });

    expect(resolveAuthState).toHaveBeenCalledWith([]);
  });
});
