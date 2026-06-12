type UpgradeRequestMessageInput = {
  ownerName: string;
  organizationName?: string;
  currentPlanName: string;
  targetPlanName: string;
};

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
