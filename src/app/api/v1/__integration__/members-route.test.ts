import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ValidationError } from "@/core/errors/app-error";
import {
  ownerRequest,
  readJsonBody,
  setupRouteIntegrationEnv,
  teardownRouteIntegrationEnv,
  TEST_ORGANIZATION_ID,
  TEST_OWNER_USER_ID,
  TEST_STORE_ID,
} from "./helpers";

const listOrganizationMembers = vi.fn();
const createOrganizationMember = vi.fn();

vi.mock("@/features/org-config/server/list-organization-members", () => ({
  listOrganizationMembers,
}));

vi.mock("@/features/org-config/server/create-organization-member", () => ({
  createOrganizationMember,
}));

describe("members route integration", () => {
  beforeEach(() => {
    setupRouteIntegrationEnv();
    listOrganizationMembers.mockReset();
    createOrganizationMember.mockReset();
  });

  afterEach(() => {
    teardownRouteIntegrationEnv();
  });

  it("GET returns organization members", async () => {
    listOrganizationMembers.mockResolvedValueOnce({
      members: [{ memberId: "member-1", name: "Ahmed", role: "employee", status: "active" }],
    });

    const { GET } = await import("../members/route");
    const response = await GET(ownerRequest("http://localhost/api/v1/members?status=active"));

    expect(response.status).toBe(200);
    const body = await readJsonBody<{ members: Array<{ memberId: string }> }>(response);
    expect(body.members).toHaveLength(1);
    expect(listOrganizationMembers).toHaveBeenCalledWith(expect.objectContaining({
      organizationId: TEST_ORGANIZATION_ID,
      actorUserId: TEST_OWNER_USER_ID,
      actorRole: "owner",
      status: "active",
    }));
  });

  it("GET rejects invalid status query", async () => {
    const { GET } = await import("../members/route");
    const response = await GET(ownerRequest("http://localhost/api/v1/members?status=deleted"));

    expect(response.status).toBe(400);
    const body = await readJsonBody<{ error: { code: string } }>(response);
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(listOrganizationMembers).not.toHaveBeenCalled();
  });

  it("POST creates a member", async () => {
    createOrganizationMember.mockResolvedValueOnce({
      memberId: "member-1",
      name: "Sara",
      role: "employee",
      status: "active",
      storeIds: [TEST_STORE_ID],
    });

    const { POST } = await import("../members/route");
    const response = await POST(
      ownerRequest("http://localhost/api/v1/members", {
        method: "POST",
        body: JSON.stringify({
          name: "Sara",
          role: "employee",
          storeIds: [TEST_STORE_ID],
        }),
      }),
    );

    expect(response.status).toBe(201);
    expect(createOrganizationMember).toHaveBeenCalledWith(expect.objectContaining({
      name: "Sara",
      role: "employee",
      storeIds: [TEST_STORE_ID],
      actorRole: "owner",
    }));
  });

  it("POST surfaces server validation errors", async () => {
    createOrganizationMember.mockRejectedValueOnce(new ValidationError("Invalid member create input."));

    const { POST } = await import("../members/route");
    const response = await POST(
      ownerRequest("http://localhost/api/v1/members", {
        method: "POST",
        body: JSON.stringify({ name: "" }),
      }),
    );

    expect(response.status).toBe(400);
    const body = await readJsonBody<{ error: { code: string } }>(response);
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(createOrganizationMember).toHaveBeenCalledOnce();
  });
});
