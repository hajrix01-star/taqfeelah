import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ServiceUnavailableError } from "@/core/errors/app-error";
import { __resetEnvCacheForTests } from "@/core/config/env";
import {
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
    process.env.NEXT_PUBLIC_CLOSEOUTS_API_ORGANIZATION_ID = TEST_ORGANIZATION_ID;
    __resetEnvCacheForTests();
    getEmployeeLoginRoster.mockReset();
  });

  afterEach(() => {
    teardownRouteIntegrationEnv();
  });

  it("GET returns employee login roster", async () => {
    getEmployeeLoginRoster.mockResolvedValueOnce([
      { id: "ahmed", name: "Ahmed", active: true },
    ]);

    const { GET } = await import("../auth/employee-roster/route");
    const response = await GET();

    expect(response.status).toBe(200);
    const body = await readJsonBody<{ staff: Array<{ id: string }> }>(response);
    expect(body.staff).toHaveLength(1);
    expect(getEmployeeLoginRoster).toHaveBeenCalledWith(TEST_ORGANIZATION_ID);
  });

  it("GET fails when organization is not configured", async () => {
    delete process.env.NEXT_PUBLIC_CLOSEOUTS_API_ORGANIZATION_ID;
    delete process.env.AUTH_ORGANIZATION_ID;
    __resetEnvCacheForTests();

    const { GET } = await import("../auth/employee-roster/route");
    const response = await GET();

    expect(response.status).toBe(503);
    expect(getEmployeeLoginRoster).not.toHaveBeenCalled();
  });

  it("GET surfaces roster service failures", async () => {
    getEmployeeLoginRoster.mockRejectedValueOnce(new ServiceUnavailableError("Roster unavailable."));

    const { GET } = await import("../auth/employee-roster/route");
    const response = await GET();

    expect(response.status).toBe(503);
    expect(getEmployeeLoginRoster).toHaveBeenCalledOnce();
  });
});
