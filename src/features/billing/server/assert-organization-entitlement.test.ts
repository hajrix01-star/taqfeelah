import { beforeEach, describe, expect, it, vi } from "vitest";
import { ValidationError } from "@/core/errors/app-error";

const resolveOrganizationEntitlements = vi.fn();
const countOrganizationUsage = vi.fn();

vi.mock("@/features/billing/server/resolve-organization-entitlements", () => ({
  resolveOrganizationEntitlements,
}));

vi.mock("@/features/billing/server/count-organization-usage", () => ({
  countOrganizationUsage,
}));

describe("assertOrganizationEntitlement", () => {
  beforeEach(() => {
    resolveOrganizationEntitlements.mockReset();
    countOrganizationUsage.mockReset();
    resolveOrganizationEntitlements.mockResolvedValue({
      billingAllowed: true,
      maxStores: 1,
      maxEmployees: 2,
      usage: {
        activeStores: 1,
        activeEmployees: 1,
        pendingInvitations: 0,
      },
    });
  });

  it("uses fresh usage counts inside a transaction executor", async () => {
    countOrganizationUsage.mockResolvedValueOnce({
      activeStores: 1,
      activeEmployees: 1,
      pendingInvitations: 0,
    });

    const { assertOrganizationEntitlement } = await import("./assert-organization-entitlement");
    const executor = { select: vi.fn() };

    await expect(
      assertOrganizationEntitlement("org-1", "add_store", { usageExecutor: executor }),
    ).rejects.toBeInstanceOf(ValidationError);

    expect(countOrganizationUsage).toHaveBeenCalledWith("org-1", executor);
  });

  it("blocks inviting employees when seats are full", async () => {
    resolveOrganizationEntitlements.mockResolvedValueOnce({
      billingAllowed: true,
      maxStores: 3,
      maxEmployees: 2,
      usage: {
        activeStores: 1,
        activeEmployees: 2,
        pendingInvitations: 0,
      },
    });

    const { assertOrganizationEntitlement } = await import("./assert-organization-entitlement");

    await expect(assertOrganizationEntitlement("org-1", "invite_employee")).rejects.toThrow(
      /Employee limit reached/,
    );
  });
});
