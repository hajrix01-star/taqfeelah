type UpgradeRequestMessageInput = {
  ownerName: string;
  organizationName?: string;
  currentPlanName: string;
  targetPlanName: string;
};

type UpgradeToPaidMessageInput = {
  ownerName: string;
  currentPlanName: string;
};

export function buildUpgradeToPaidWhatsAppMessage(input: UpgradeToPaidMessageInput): string {
  return [
    `مرحبًا، أنا ${input.ownerName || "مالك النشاط"}.`,
    "",
    "أرغب بالترقية من الخطة التجريبية إلى خطة مدفوعة في تقفيلة.",
    `الخطة الحالية: ${input.currentPlanName}`,
    "",
    "شكرًا.",
  ].join("\n");
}

export function buildUpgradeRequestWhatsAppMessage(input: UpgradeRequestMessageInput): string {
  const organizationLine = input.organizationName?.trim()
    ? `النشاط: ${input.organizationName.trim()}`
    : "";

  return [
    `مرحبًا، أنا ${input.ownerName || "مالك النشاط"}.`,
    "",
    "أرغب بترقية اشتراك تقفيلة:",
    `الخطة الحالية: ${input.currentPlanName}`,
    `الخطة المطلوبة: ${input.targetPlanName}`,
    organizationLine,
    "",
    "شكرًا.",
  ].filter(Boolean).join("\n");
}
