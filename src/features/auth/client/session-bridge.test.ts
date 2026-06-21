import { beforeEach, describe, expect, it, vi } from "vitest";

const loginOwnerSessionViaApi = vi.fn();
const loginEmployeeSessionViaApi = vi.fn();
const logoutSessionViaApi = vi.fn();
const getSessionStatusViaApi = vi.fn();
const saveAuthSession = vi.fn();
const clearAuthSession = vi.fn();

vi.mock("@/features/runtime-settings/client/runtime-session-and-settings-api-client", () => ({
  loginOwnerSessionViaApi,
  loginOwnerPhoneSessionViaApi: vi.fn(),
  loginEmployeeSessionViaApi,
  loginEmployeePhoneSessionViaApi: vi.fn(),
  logoutSessionViaApi,
  getSessionStatusViaApi,
}));

vi.mock("@/features/demo/login-credentials-storage", () => ({
  saveAuthSession,
  clearAuthSession,
  resolveAuthStateFromSession: vi.fn(),
}));

vi.mock("@/features/demo/prototype-auth-boot", () => ({
  readPrototypeAuthBoot: vi.fn(() => ({
    loggedIn: false,
    employee: false,
    loggedInEmployeeId: null,
    employeeBusinessId: "",
  })),
}));

describe("session bridge", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("persists local owner session after login", async () => {
    const { persistLocalOwnerSession } = await import("./session-bridge");
    persistLocalOwnerSession();
    expect(saveAuthSession).toHaveBeenCalledWith({ role: "owner" });
  });

  it("routes owner login through api only in server-auth mode", async () => {
    loginOwnerSessionViaApi.mockResolvedValue({ userId: "owner-1" });
    const { loginOwnerViaSessionBridge } = await import("./session-bridge");

    await expect(loginOwnerViaSessionBridge({
      username: "hajri",
      password: "secret",
      useServerAuth: true,
    })).resolves.toEqual({
      authenticated: false,
      userId: "owner-1",
      role: undefined,
      organizationId: undefined,
      displayName: undefined,
      mustChangePassword: false,
    });
    expect(loginOwnerSessionViaApi).toHaveBeenCalledWith({ username: "hajri", password: "secret" });

    await expect(loginOwnerViaSessionBridge({
      username: "hajri",
      password: "secret",
      useServerAuth: false,
    })).resolves.toBeNull();
  });

  it("clears local session on logout and calls api when server auth is active", async () => {
    const { logoutViaSessionBridge } = await import("./session-bridge");

    await logoutViaSessionBridge({ useServerAuth: true });
    expect(logoutSessionViaApi).toHaveBeenCalled();
    expect(clearAuthSession).toHaveBeenCalled();

    vi.clearAllMocks();
    await logoutViaSessionBridge({ useServerAuth: false });
    expect(logoutSessionViaApi).not.toHaveBeenCalled();
    expect(clearAuthSession).toHaveBeenCalled();
  });
});
