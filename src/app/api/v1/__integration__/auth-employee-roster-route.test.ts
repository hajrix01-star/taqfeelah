import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ServiceUnavailableError } from "@/core/errors/app-error";
import { __resetEnvCacheForTests } from "@/core/config/env";
import {
  employeeRequest,
  ownerRequest,
  readJsonBody,
  setupRouteIntegrationEnv,
  teardownRouteIntegrationEnv,
  TEST_ORGANIZATION_ID,
} from "./helpers";

const getEmployeeLoginRoster = vi.fn();

vi.mock("@/features/runtime-settings/server/runtime-settings-service", () => ({
  getEmployeeLoginRoster,
}));

describe("auth employee roster route integration", () => {
  beforeEach(() => {
    setupRouteIntegrationEnv();
    __resetEnvCacheForTests();
    getEmployeeLoginRoster.mockReset();
  });

  afterEach(() => {
    teardownRouteIntegrationEnv();
  });

  it("GET returns employee login roster for authenticated owners", async () => {
    getEmployeeLoginRoster.mockResolvedValueOnce([
      { id: "ahmed", name: "Ahmed", active: true },
    ]);

    const { GET } = await import("../auth/employee-roster/route");
    const response = await GET(ownerRequest("http://localhost/api/v1/auth/employee-roster"));

    expect(response.status).toBe(200);
    const body = await readJsonBody<{ staff: Array<{ id: string }> }>(response);
    expect(body.staff).toHaveLength(1);
    expect(getEmployeeLoginRoster).toHaveBeenCalledWith(TEST_ORGANIZATION_ID);
  });

  it("GET returns employee login roster for authenticated employees", async () => {
    getEmployeeLoginRoster.mockResolvedValueOnce([]);

    const { GET } = await import("../auth/employee-roster/route");
    const response = await GET(employeeRequest("http://localhost/api/v1/auth/employee-roster"));

    expect(response.status).toBe(200);
    expect(getEmployeeLoginRoster).toHaveBeenCalledWith(TEST_ORGANIZATION_ID);
  });

  it("GET rejects unauthenticated requests", async () => {
    const { GET } = await import("../auth/employee-roster/route");
    const response = await GET(new Request("http://localhost/api/v1/auth/employee-roster"));

    expect(response.status).toBe(400);
    expect(getEmployeeLoginRoster).not.toHaveBeenCalled();
  });

  it("GET fails when organization context is missing", async () => {
    delete process.env.NEXT_PUBLIC_CLOSEOUTS_API_ORGANIZATION_ID;
    delete process.env.AUTH_ORGANIZATION_ID;
    __resetEnvCacheForTests();

    const { GET } = await import("../auth/employee-roster/route");
    const response = await GET(new Request("http://localhost/api/v1/auth/employee-roster", {
      headers: {
        "x-user-id": "e8f3e35b-6051-4da3-8b10-979700c2f00f",
        "x-member-role": "owner",
      },
    }));

    expect(response.status).toBe(400);
    expect(getEmployeeLoginRoster).not.toHaveBeenCalled();
  });

  it("GET surfaces roster service failures", async () => {
    getEmployeeLoginRoster.mockRejectedValueOnce(new ServiceUnavailableError("Roster unavailable."));

    const { GET } = await import("../auth/employee-roster/route");
    const response = await GET(ownerRequest("http://localhost/api/v1/auth/employee-roster"));

    expect(response.status).toBe(503);
    expect(getEmployeeLoginRoster).toHaveBeenCalledOnce();
  });
});
