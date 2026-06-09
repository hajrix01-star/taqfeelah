import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  employeeRequest,
  readJsonBody,
  setupRouteIntegrationEnv,
  teardownRouteIntegrationEnv,
  TEST_EMPLOYEE_USER_ID,
  TEST_ORGANIZATION_ID,
} from "./helpers";

const getEmployeePreferences = vi.fn();
const saveEmployeePreferences = vi.fn();

vi.mock("@/features/runtime-settings/server/employee-preferences-service", () => ({
  getEmployeePreferences,
  saveEmployeePreferences,
}));

describe("me preferences route integration", () => {
  beforeEach(() => {
    setupRouteIntegrationEnv();
    getEmployeePreferences.mockReset();
    saveEmployeePreferences.mockReset();
  });

  afterEach(() => {
    teardownRouteIntegrationEnv();
  });

  it("GET returns employee preferences", async () => {
    getEmployeePreferences.mockResolvedValueOnce({ notebookTheme: "ivory" });

    const { GET } = await import("../me/preferences/route");
    const response = await GET(employeeRequest("http://localhost/api/v1/me/preferences"));

    expect(response.status).toBe(200);
    const body = await readJsonBody<{ preferences: { notebookTheme: string } }>(response);
    expect(body.preferences.notebookTheme).toBe("ivory");
    expect(getEmployeePreferences).toHaveBeenCalledWith(expect.objectContaining({
      organizationId: TEST_ORGANIZATION_ID,
      actorUserId: TEST_EMPLOYEE_USER_ID,
      actorRole: "employee",
    }));
  });

  it("PATCH saves employee preferences", async () => {
    saveEmployeePreferences.mockResolvedValueOnce({ notebookTheme: "greenTint" });

    const { PATCH } = await import("../me/preferences/route");
    const response = await PATCH(
      employeeRequest("http://localhost/api/v1/me/preferences", {
        method: "PATCH",
        body: JSON.stringify({ preferences: { notebookTheme: "greenTint" } }),
      }),
    );

    expect(response.status).toBe(200);
    const body = await readJsonBody<{ preferences: { notebookTheme: string } }>(response);
    expect(body.preferences.notebookTheme).toBe("greenTint");
    expect(saveEmployeePreferences).toHaveBeenCalledWith(expect.objectContaining({
      preferences: { notebookTheme: "greenTint" },
      actorRole: "employee",
    }));
  });
});
