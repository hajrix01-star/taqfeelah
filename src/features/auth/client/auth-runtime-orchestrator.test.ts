import { describe, expect, it, vi } from "vitest";
import {
  applyEmployeeLoginSuccess,
  applyLogoutReset,
  applyOwnerLoginSuccess,
  applyServerSessionBootstrap,
} from "./auth-runtime-orchestrator";

vi.mock("./session-bridge", () => ({
  persistLocalOwnerSession: vi.fn(),
  persistLocalEmployeeSession: vi.fn(),
}));

vi.mock("@/features/employee-closeouts/employee-theme-storage", () => ({
  readEmployeeNotebookTheme: vi.fn(() => "classic"),
}));

vi.mock("@/core/config/runtime-capabilities", () => ({
  usesRuntimeSettingsApi: vi.fn(() => false),
}));

describe("auth runtime orchestrator", () => {
  it("applies owner login success state", () => {
    const apply = {
      setSessionOrganizationId: vi.fn(),
      setSessionUserId: vi.fn(),
      setLoggedIn: vi.fn(),
      setEmployee: vi.fn(),
      setLoggedInEmployeeId: vi.fn(),
      setAuthScreen: vi.fn(),
      setOwnerPage: vi.fn(),
      setOwnerProfile: vi.fn(),
    };

    applyOwnerLoginSuccess({
      apiUserId: "owner-uuid",
      organizationId: "org-uuid",
      displayName: "Tenant Owner",
      prototypeAccessMode: false,
      apply,
    });

    expect(apply.setSessionOrganizationId).toHaveBeenCalledWith("org-uuid");
    expect(apply.setSessionUserId).toHaveBeenCalledWith("owner-uuid");
    expect(apply.setLoggedIn).toHaveBeenCalledWith(true);
    expect(apply.setEmployee).toHaveBeenCalledWith(false);
    expect(apply.setLoggedInEmployeeId).toHaveBeenCalledWith(null);
    expect(apply.setOwnerPage).toHaveBeenCalledWith("home");
    expect(apply.setOwnerProfile).toHaveBeenCalledWith({ name: "Tenant Owner" });
  });

  it("applies employee login success state from staff roster", () => {
    const apply = {
      setSessionUserId: vi.fn(),
      setSessionOrganizationId: vi.fn(),
      setLoggedIn: vi.fn(),
      setEmployee: vi.fn(),
      setLoggedInEmployeeId: vi.fn(),
      setEmployeeBusinessId: vi.fn(),
      setEmployeeThemeOverride: vi.fn(),
      setEmployeePage: vi.fn(),
      setAuthScreen: vi.fn(),
    };

    const ok = applyEmployeeLoginSuccess({
      personId: "ahmed",
      apiUserId: "employee-uuid",
      organizationId: "org-uuid",
      staff: [{ id: "ahmed", active: true, storeIds: ["shami"] }],
      activeBusinesses: [{ id: "arz" }],
      prototypeAccessMode: false,
      apply,
    });

    expect(ok).toBe(true);
    expect(apply.setSessionOrganizationId).toHaveBeenCalledWith("org-uuid");
    expect(apply.setLoggedInEmployeeId).toHaveBeenCalledWith("ahmed");
    expect(apply.setEmployeeBusinessId).toHaveBeenCalledWith("shami");
    expect(apply.setEmployeePage).toHaveBeenCalledWith("closeouts");
  });

  it("bootstraps authenticated employee session from server", () => {
    const apply = {
      setSessionOrganizationId: vi.fn(),
      setSessionUserId: vi.fn(),
      setLoggedIn: vi.fn(),
      setEmployee: vi.fn(),
      setLoggedInEmployeeId: vi.fn(),
      setEmployeePage: vi.fn(),
      setAuthScreen: vi.fn(),
      setOwnerPage: vi.fn(),
    };

    expect(applyServerSessionBootstrap({
      authenticated: true,
      role: "employee",
      userId: "employee-uuid",
      organizationId: "org-uuid",
    }, apply)).toBe(true);
    expect(apply.setSessionOrganizationId).toHaveBeenCalledWith("org-uuid");
    expect(apply.setEmployee).toHaveBeenCalledWith(true);
    expect(apply.setLoggedInEmployeeId).toHaveBeenCalledWith("employee-uuid");
  });

  it("resets runtime auth state on logout", () => {
    const apply = {
      setLoggedIn: vi.fn(),
      setOperationalEntries: vi.fn(),
      setStaff: vi.fn(),
      setConfiguredBusinesses: vi.fn(),
      setArchivedBusinessIds: vi.fn(),
      setAuthOwnerUsername: vi.fn(),
      setAuthOwnerPassword: vi.fn(),
      setAuthEmployeePins: vi.fn(),
      setOwnerProfile: vi.fn(),
      setSelectedBusiness: vi.fn(),
    };

    applyLogoutReset({ bindsToServerAuth: true, apply });
    expect(apply.setLoggedIn).toHaveBeenCalledWith(false);
    expect(apply.setOperationalEntries).toHaveBeenCalledWith([]);
    expect(apply.setStaff).toHaveBeenCalledWith([]);
    expect(apply.setOwnerProfile).toHaveBeenCalledWith({ name: "" });
  });
});
