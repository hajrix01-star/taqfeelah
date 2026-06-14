import { buildWhatsAppShareUrl } from "@/core/whatsapp/share-link";
import {
  buildRenewalReminderWhatsAppMessage,
  buildUpgradeRequestWhatsAppMessage,
  buildUpgradeToPaidWhatsAppMessage,
} from "@/core/messaging/whatsapp-billing-messages";
import { PROTOTYPE_SUPPORT_WHATSAPP } from "@/components/prototype-runtime/prototype-runtime-boot";

export function openBillingUpgradeToPaidSupport({
  ownerName,
  currentPlanName,
}) {
  const message = buildUpgradeToPaidWhatsAppMessage({
    ownerName,
    currentPlanName,
  });
  const url = buildWhatsAppShareUrl(message, PROTOTYPE_SUPPORT_WHATSAPP);
  window.open(url, "_blank", "noopener,noreferrer");
}

export function openBillingUpgradeSupport({
  ownerName,
  organizationName,
  currentPlanName,
  targetPlanName,
}) {
  const message = buildUpgradeRequestWhatsAppMessage({
    ownerName,
    organizationName,
    currentPlanName,
    targetPlanName,
  });
  const url = buildWhatsAppShareUrl(message, PROTOTYPE_SUPPORT_WHATSAPP);
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
}) {
  const message = buildRenewalReminderWhatsAppMessage({
    ownerName,
    organizationName,
    planDisplayNameAr,
    planDisplayNameEn,
    billingCycle,
    daysUntilEnd,
    periodEndIso,
  });
  const url = buildWhatsAppShareUrl(message, PROTOTYPE_SUPPORT_WHATSAPP);
  window.open(url, "_blank", "noopener,noreferrer");
}
