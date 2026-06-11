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

const updateSaasAccount = vi.fn();
const updateSaasAccountOwner = vi.fn();
const updateSaasAccountMember = vi.fn();

vi.mock("@/features/saas-admin/server/update-saas-account", () => ({
  updateSaasAccount,
}));

vi.mock("@/features/saas-admin/server/update-saas-account-owner", () => ({
  updateSaasAccountOwner,
}));

vi.mock("@/features/saas-admin/server/update-saas-account-member", () => ({
  updateSaasAccountMember,
}));

describe("saas admin account edit routes integration", () => {
  beforeEach(() => {
    setupRouteIntegrationEnv();
    process.env.SAAS_ADMIN_API_ENABLED = "true";
    process.env.SAAS_PLATFORM_ADMIN_USER_IDS = TEST_OWNER_USER_ID;
    __resetEnvCacheForTests();
    updateSaasAccount.mockReset();
    updateSaasAccountOwner.mockReset();
    updateSaasAccountMember.mockReset();
  });

  afterEach(() => {
    teardownRouteIntegrationEnv();
    delete process.env.SAAS_ADMIN_API_ENABLED;
    delete process.env.SAAS_PLATFORM_ADMIN_USER_IDS;
  });

  it("PATCH /saas-admin/accounts/:id updates account fields", async () => {
    updateSaasAccount.mockResolvedValueOnce({
      organizationId: "org-1",
      organizationName: "Acme 2",
      status: "active",
      planCode: "growth",
      updatedAt: "2026-06-11T00:00:00.000Z",
    });

    const { PATCH } = await import("../saas-admin/accounts/[id]/route");
    const response = await PATCH(
      ownerRequest("http://localhost/api/v1/saas-admin/accounts/org-1", {
        method: "PATCH",
        body: JSON.stringify({
          organizationName: "Acme 2",
          status: "active",
          planCode: "growth",
        }),
      }),
      { params: Promise.resolve({ id: "org-1" }) },
    );

    expect(response.status).toBe(200);
    expect(updateSaasAccount).toHaveBeenCalledWith(expect.objectContaining({
      actorUserId: TEST_OWNER_USER_ID,
      organizationId: "org-1",
      name: "Acme 2",
      planCode: "growth",
    }));
  });

  it("PATCH /saas-admin/accounts/:id/owner updates owner fields", async () => {
    updateSaasAccountOwner.mockResolvedValueOnce({
      organizationId: "org-1",
      ownerUserId: "user-1",
      ownerName: "Owner 2",
      ownerUsername: "owner2",
      updatedAt: "2026-06-11T00:00:00.000Z",
    });

    const { PATCH } = await import("../saas-admin/accounts/[id]/owner/route");
    const response = await PATCH(
      ownerRequest("http://localhost/api/v1/saas-admin/accounts/org-1/owner", {
        method: "PATCH",
        body: JSON.stringify({
          ownerName: "Owner 2",
          ownerUsername: "owner2",
          ownerPassword: "secret",
        }),
      }),
      { params: Promise.resolve({ id: "org-1" }) },
    );

    expect(response.status).toBe(200);
    expect(updateSaasAccountOwner).toHaveBeenCalledWith(expect.objectContaining({
      organizationId: "org-1",
      ownerName: "Owner 2",
      ownerUsername: "owner2",
      ownerPassword: "secret",
    }));
  });

  it("PATCH /saas-admin/accounts/:id/members/:memberId updates member fields", async () => {
    updateSaasAccountMember.mockResolvedValueOnce({
      memberId: "member-2",
      userId: "user-2",
      name: "Sara 2",
      role: "manager",
      status: "active",
      updatedAt: "2026-06-11T00:00:00.000Z",
    });

    const { PATCH } = await import("../saas-admin/accounts/[id]/members/[memberId]/route");
    const response = await PATCH(
      ownerRequest("http://localhost/api/v1/saas-admin/accounts/org-1/members/member-2", {
        method: "PATCH",
        body: JSON.stringify({
          name: "Sara 2",
          role: "manager",
        }),
      }),
      { params: Promise.resolve({ id: "org-1", memberId: "member-2" }) },
    );

    expect(response.status).toBe(200);
    expect(updateSaasAccountMember).toHaveBeenCalledWith(expect.objectContaining({
      organizationId: "org-1",
      memberId: "member-2",
      name: "Sara 2",
      role: "manager",
    }));
  });

  it("PATCH /saas-admin/accounts/:id surfaces validation errors", async () => {
    updateSaasAccount.mockRejectedValueOnce(new ValidationError("Organization was not found."));

    const { PATCH } = await import("../saas-admin/accounts/[id]/route");
    const response = await PATCH(
      ownerRequest("http://localhost/api/v1/saas-admin/accounts/org-1", {
        method: "PATCH",
        body: JSON.stringify({ organizationName: "Acme" }),
      }),
      { params: Promise.resolve({ id: "org-1" }) },
    );

    expect(response.status).toBe(400);
    const body = await readJsonBody<{ error: { code: string } }>(response);
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });
});
