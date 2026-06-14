import { getDb } from "@/core/db/client";
import { ValidationError } from "@/core/errors/app-error";
import { countOrganizationUsage } from "@/features/billing/server/count-organization-usage";
import { resolveOrganizationEntitlements } from "@/features/billing/server/resolve-organization-entitlements";
import type { EntitlementAction } from "@/features/billing/types";

type AssertOrganizationEntitlementOptions = {
  usageExecutor?: Pick<ReturnType<typeof getDb>, "select">;
};

export async function assertOrganizationEntitlement(
  organizationId: string,
  action: EntitlementAction,
  options?: AssertOrganizationEntitlementOptions,
): Promise<void> {
  const entitlements = await resolveOrganizationEntitlements(organizationId);
  const usage = options?.usageExecutor
    ? await countOrganizationUsage(organizationId, options.usageExecutor)
    : entitlements.usage;

  if (!entitlements.billingAllowed && action !== "use_app") {
    throw new ValidationError(
      "Subscription is inactive or trial has expired. Contact Taqfeelah support to renew.",
    );
  }

  if (action === "use_app" && !entitlements.billingAllowed) {
    throw new ValidationError(
      "Account is suspended, archived, or pending activation.",
    );
  }

  if (action === "add_store") {
    if (usage.activeStores >= entitlements.maxStores) {
      throw new ValidationError(
        `Store limit reached (${entitlements.maxStores}). Upgrade your plan to add more stores.`,
      );
    }
    return;
  }

  if (action === "invite_employee" || action === "activate_employee") {
    const seatUsage = usage.activeEmployees + usage.pendingInvitations;
    const seatsAfter = action === "activate_employee" ? seatUsage : seatUsage + 1;
    if (seatsAfter > entitlements.maxEmployees) {
      throw new ValidationError(
        `Employee limit reached (${entitlements.maxEmployees}). Upgrade your plan or revoke pending invitations.`,
      );
    }
  }
}
