import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ValidationError } from "@/core/errors/app-error";
import {
  ownerRequest,
  readJsonBody,
  routeMemberContext,
  setupRouteIntegrationEnv,
  teardownRouteIntegrationEnv,
  TEST_MEMBER_ID,
  TEST_STORE_ID,
} from "./helpers";

const updateOrganizationMember = vi.fn();

vi.mock("@/features/org-config/server/update-organization-member", () => ({
  updateOrganizationMember,
}));

describe("member patch route integration", () => {
  beforeEach(() => {
    setupRouteIntegrationEnv();
    updateOrganizationMember.mockReset();
  });

  afterEach(() => {
    teardownRouteIntegrationEnv();
  });

  it("PATCH updates member profile and store access", async () => {
    updateOrganizationMember.mockResolvedValueOnce({
      memberId: TEST_MEMBER_ID,
      name: "Sara",
      role: "employee",
      status: "active",
      storeIds: [TEST_STORE_ID],
    });

    const { PATCH } = await import("../members/[memberId]/route");
    const response = await PATCH(
      ownerRequest(`http://localhost/api/v1/members/${TEST_MEMBER_ID}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: "Sara",
          storeIds: [TEST_STORE_ID],
          status: "active",
        }),
      }),
      routeMemberContext(),
    );

    expect(response.status).toBe(200);
    const body = await readJsonBody<{ name: string }>(response);
    expect(body.name).toBe("Sara");
    expect(updateOrganizationMember).toHaveBeenCalledWith(expect.objectContaining({
      memberId: TEST_MEMBER_ID,
      name: "Sara",
      storeIds: [TEST_STORE_ID],
      status: "active",
      actorRole: "owner",
    }));
  });

  it("PATCH deactivates a member", async () => {
    updateOrganizationMember.mockResolvedValueOnce({
      memberId: TEST_MEMBER_ID,
      status: "inactive",
    });

    const { PATCH } = await import("../members/[memberId]/route");
    const response = await PATCH(
      ownerRequest(`http://localhost/api/v1/members/${TEST_MEMBER_ID}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "inactive", reason: "left_company" }),
      }),
      routeMemberContext(),
    );

    expect(response.status).toBe(200);
    expect(updateOrganizationMember).toHaveBeenCalledWith(expect.objectContaining({
      status: "inactive",
      reason: "left_company",
    }));
  });

  it("PATCH surfaces server validation errors", async () => {
    updateOrganizationMember.mockRejectedValueOnce(new ValidationError("Invalid member update input."));

    const { PATCH } = await import("../members/[memberId]/route");
    const response = await PATCH(
      ownerRequest(`http://localhost/api/v1/members/${TEST_MEMBER_ID}`, {
        method: "PATCH",
        body: JSON.stringify({ name: "" }),
      }),
      routeMemberContext(),
    );

    expect(response.status).toBe(400);
    const body = await readJsonBody<{ error: { code: string } }>(response);
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(updateOrganizationMember).toHaveBeenCalledOnce();
  });
});
