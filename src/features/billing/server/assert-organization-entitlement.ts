import { ValidationError } from "@/core/errors/app-error";
import { resolveOrganizationEntitlements } from "@/features/billing/server/resolve-organization-entitlements";
import type { EntitlementAction } from "@/features/billing/types";

export async function assertOrganizationEntitlement(
  organizationId: string,
  action: EntitlementAction,
): Promise<void> {
  const entitlements = await resolveOrganizationEntitlements(organizationId);

  if (!entitlements.billingAllowed && action !== "use_app") {
    throw new ValidationError(
      "Subscription is inactive or trial has expired. Contact Taqfeelah support to renew.",
    );
  }

  if (action === "use_app" && !entitlements.billingAllowed) {
    throw new ValidationError(
      "Account is suspended or pending activation.",
    );
  }

  if (action === "add_store") {
    if (entitlements.usage.activeStores >= entitlements.maxStores) {
      throw new ValidationError(
        `Store limit reached (${entitlements.maxStores}). Upgrade your plan to add more stores.`,
      );
    }
    return;
  }

  if (action === "invite_employee" || action === "activate_employee") {
    const seatUsage =
      entitlements.usage.activeEmployees + entitlements.usage.pendingInvitations;
    const seatsAfter = action === "activate_employee" ? seatUsage : seatUsage + 1;
    if (seatsAfter > entitlements.maxEmployees) {
      throw new ValidationError(
        `Employee limit reached (${entitlements.maxEmployees}). Upgrade your plan or revoke pending invitations.`,
      );
    }
  }
}
