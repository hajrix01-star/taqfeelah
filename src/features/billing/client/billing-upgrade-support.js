import { buildWhatsAppShareUrl } from "@/core/whatsapp/share-link";
import { buildUpgradeRequestWhatsAppMessage } from "@/core/messaging/whatsapp-billing-messages";
import { PROTOTYPE_SUPPORT_WHATSAPP } from "@/components/prototype-runtime/prototype-runtime-boot";

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
