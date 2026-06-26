import { describe, expect, it, vi } from "vitest";
import { readRuntimeAuthBootState } from "./runtime-auth-boot-state";

describe("runtime auth boot state", () => {
  it("returns logged-out boot when server auth is not active", () => {
    expect(readRuntimeAuthBootState({
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

    const boot = readRuntimeAuthBootState({
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

    readRuntimeAuthBootState({
      bindsToServerAuth: true,
      readSavedSettings: () => null,
      defaultStaff: [],
      resolveAuthState,
    });

    expect(resolveAuthState).toHaveBeenCalledWith([]);
  });
});
