import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ValidationError } from "@/core/errors/app-error";
import { __resetEnvCacheForTests } from "@/core/config/env";
import {
  ownerRequest,
  readJsonBody,
  setupRouteIntegrationEnv,
  teardownRouteIntegrationEnv,
  TEST_OWNER_USER_ID,
} from "./helpers";

const createSaasAccount = vi.fn();
const createSaasAccountMember = vi.fn();

vi.mock("@/features/saas-admin/server/create-saas-account", () => ({
  createSaasAccount,
}));

vi.mock("@/features/saas-admin/server/create-saas-account-member", () => ({
  createSaasAccountMember,
}));

describe("saas admin provision routes integration", () => {
  beforeEach(() => {
    setupRouteIntegrationEnv();
    process.env.SAAS_ADMIN_API_ENABLED = "true";
    process.env.SAAS_PLATFORM_ADMIN_USER_IDS = TEST_OWNER_USER_ID;
    __resetEnvCacheForTests();
    createSaasAccount.mockReset();
    createSaasAccountMember.mockReset();
  });

  afterEach(() => {
    teardownRouteIntegrationEnv();
    delete process.env.SAAS_ADMIN_API_ENABLED;
    delete process.env.SAAS_PLATFORM_ADMIN_USER_IDS;
  });

  it("POST /saas-admin/accounts returns 503 when API flag is off", async () => {
    process.env.SAAS_ADMIN_API_ENABLED = "false";
    __resetEnvCacheForTests();

    const { POST } = await import("../saas-admin/accounts/route");
    const response = await POST(
      ownerRequest("http://localhost/api/v1/saas-admin/accounts", {
        method: "POST",
        body: JSON.stringify({ organizationName: "Acme" }),
      }),
    );

    expect(response.status).toBe(503);
    expect(createSaasAccount).not.toHaveBeenCalled();
  });

  it("POST /saas-admin/accounts provisions an account", async () => {
    createSaasAccount.mockResolvedValueOnce({
      organizationId: "org-1",
      organizationName: "Acme",
      ownerUserId: "user-1",
      ownerMemberId: "member-1",
      ownerUsername: "acme-owner",
      storeId: "store-1",
      storeName: "Acme",
      subscriptionId: "sub-1",
      planCode: "starter",
      status: "trial",
      createdAt: "2026-06-11T00:00:00.000Z",
    });

    const { POST } = await import("../saas-admin/accounts/route");
    const response = await POST(
      ownerRequest("http://localhost/api/v1/saas-admin/accounts", {
        method: "POST",
        body: JSON.stringify({
          organizationName: "Acme",
          ownerName: "Owner",
          ownerUsername: "acme-owner",
          ownerPassword: "secret",
          planCode: "starter",
        }),
      }),
    );

    expect(response.status).toBe(201);
    const body = await readJsonBody<{ organizationId: string }>(response);
    expect(body.organizationId).toBe("org-1");
    expect(createSaasAccount).toHaveBeenCalledWith(expect.objectContaining({
      actorUserId: TEST_OWNER_USER_ID,
      organizationName: "Acme",
      ownerUsername: "acme-owner",
      planCode: "starter",
    }));
  });

  it("POST /saas-admin/accounts surfaces validation errors", async () => {
    createSaasAccount.mockRejectedValueOnce(new ValidationError("Owner username is already taken."));

    const { POST } = await import("../saas-admin/accounts/route");
    const response = await POST(
      ownerRequest("http://localhost/api/v1/saas-admin/accounts", {
        method: "POST",
        body: JSON.stringify({
          organizationName: "Acme",
          ownerName: "Owner",
          ownerUsername: "taken",
          ownerPassword: "secret",
        }),
      }),
    );

    expect(response.status).toBe(409);
    const body = await readJsonBody<{ error: { code: string; cause?: string } }>(response);
    expect(body.error.code).toBe("OWNER_USERNAME_TAKEN");
    expect(body.error.cause).toBeTruthy();
  });

  it("POST /saas-admin/accounts/:id/members provisions a member", async () => {
    createSaasAccountMember.mockResolvedValueOnce({
      memberId: "member-2",
      userId: "user-2",
      name: "Sara",
      role: "employee",
      status: "active",
      storeIds: [],
      createdAt: "2026-06-11T00:00:00.000Z",
      updatedAt: "2026-06-11T00:00:00.000Z",
    });

    const { POST } = await import("../saas-admin/accounts/[id]/members/route");
    const response = await POST(
      ownerRequest("http://localhost/api/v1/saas-admin/accounts/org-1/members", {
        method: "POST",
        body: JSON.stringify({
          name: "Sara",
          role: "employee",
          pin: "1234",
        }),
      }),
      { params: Promise.resolve({ id: "org-1" }) },
    );

    expect(response.status).toBe(201);
    expect(createSaasAccountMember).toHaveBeenCalledWith(expect.objectContaining({
      organizationId: "org-1",
      name: "Sara",
      role: "employee",
      pin: "1234",
      actorUserId: TEST_OWNER_USER_ID,
    }));
  });
});
