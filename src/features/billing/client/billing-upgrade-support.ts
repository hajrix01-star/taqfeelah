import { buildWhatsAppShareUrl } from "@/core/whatsapp/share-link";
import { resolveSupportWhatsAppNumber } from "@/core/config/marketing-support";
import {
  buildRenewalReminderWhatsAppMessage,
  buildUpgradeRequestWhatsAppMessage,
  buildUpgradeToPaidWhatsAppMessage,
} from "@/core/messaging/whatsapp-billing-messages";
import type {
  BillingRenewalSupportInput,
  BillingUpgradeSupportInput,
  BillingUpgradeToPaidSupportInput,
} from "@/features/billing/client/billing-client-types";

export function openBillingUpgradeToPaidSupport({
  ownerName,
  currentPlanName,
  organizationName,
  accountNumber,
}: BillingUpgradeToPaidSupportInput): void {
  const message = buildUpgradeToPaidWhatsAppMessage({
    ownerName,
    currentPlanName,
    organizationName,
    accountNumber,
  });
  const url = buildWhatsAppShareUrl(message, resolveSupportWhatsAppNumber());
  window.open(url, "_blank", "noopener,noreferrer");
}

export function openBillingUpgradeSupport({
  ownerName,
  organizationName,
  accountNumber,
  currentPlanName,
  targetPlanName,
}: BillingUpgradeSupportInput): void {
  const message = buildUpgradeRequestWhatsAppMessage({
    ownerName,
    organizationName,
    accountNumber,
    currentPlanName,
    targetPlanName,
  });
  const url = buildWhatsAppShareUrl(message, resolveSupportWhatsAppNumber());
  window.open(url, "_blank", "noopener,noreferrer");
}

export function openBillingRenewalSupport({
  ownerName,
  organizationName,
  planDisplayNameAr,
  planDisplayNameEn,
  billingCycle,
  daysUntilEnd,
  periodEndIso,
}: BillingRenewalSupportInput): void {
  const message = buildRenewalReminderWhatsAppMessage({
    ownerName,
    organizationName,
    planDisplayNameAr,
    planDisplayNameEn,
    billingCycle,
    daysUntilEnd,
    periodEndIso,
  });
  const url = buildWhatsAppShareUrl(message, resolveSupportWhatsAppNumber());
  window.open(url, "_blank", "noopener,noreferrer");
}
