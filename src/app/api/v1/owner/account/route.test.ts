import { beforeEach, describe, expect, it, vi } from "vitest";

const { resolveRequestContext, assertOrganizationAccess, resolveOwnerAccountSummary } = vi.hoisted(() => ({
  resolveRequestContext: vi.fn(),
  assertOrganizationAccess: vi.fn(async () => undefined),
  resolveOwnerAccountSummary: vi.fn(async () => ({
    ownerUserId: "11111111-1111-4111-8111-111111111111",
    ownerName: "محمد",
    organizationId: "22222222-2222-4222-8222-222222222222",
    organizationName: "مطعم محمد",
    email: "owner@example.com",
    loginPhone: "+966501234567",
    loginPhoneDisplay: "+966 501234567",
    loginMethod: "phone_password" as const,
  })),
}));

vi.mock("@/core/auth/request-context", () => ({
  resolveRequestContext,
}));

vi.mock("@/core/auth/assert-organization-access", () => ({
  assertOrganizationAccess,
}));

vi.mock("@/features/owner-account/server/resolve-owner-account-summary", () => ({
  resolveOwnerAccountSummary,
}));

import { GET } from "@/app/api/v1/owner/account/route";

describe("GET /api/v1/owner/account", () => {
  beforeEach(() => {
    resolveRequestContext.mockReset();
    assertOrganizationAccess.mockClear();
    resolveOwnerAccountSummary.mockClear();
    resolveRequestContext.mockReturnValue({
      organizationId: "22222222-2222-4222-8222-222222222222",
      userId: "11111111-1111-4111-8111-111111111111",
      role: "owner",
    });
  });

  it("returns owner account summary for authenticated owner", async () => {
    const response = await GET(new Request("http://localhost/api/v1/owner/account"));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.email).toBe("owner@example.com");
    expect(body.loginPhoneDisplay).toBe("+966 501234567");
    expect(assertOrganizationAccess).toHaveBeenCalledWith(expect.objectContaining({ minimumRole: "owner" }));
  });
});
