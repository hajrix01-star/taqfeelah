type RenewalReminderMessageInput = {
  ownerName: string;
  organizationName?: string;
  planDisplayNameAr: string;
  planDisplayNameEn: string;
  billingCycle: string;
  daysUntilEnd: number;
  periodEndIso: string;
};

type UpgradeRequestMessageInput = {
  ownerName: string;
  organizationName?: string;
  organizationId?: string;
  currentPlanName: string;
  targetPlanName: string;
};

type UpgradeToPaidMessageInput = {
  ownerName: string;
  currentPlanName: string;
  organizationName?: string;
  organizationId?: string;
};

function buildOrganizationReferenceLines(input: { organizationName?: string; organizationId?: string }) {
  const lines: string[] = [];
  const organizationName = input.organizationName?.trim();
  if (organizationName) {
    lines.push(`النشاط: ${organizationName}`);
  }
  const organizationId = input.organizationId?.trim();
  if (organizationId) {
    lines.push(`معرف الحساب: ${organizationId}`);
  }
  return lines;
}

export function buildUpgradeToPaidWhatsAppMessage(input: UpgradeToPaidMessageInput): string {
  return [
    `مرحبًا، أنا ${input.ownerName || "مالك النشاط"}.`,
    "",
    "أرغب بالترقية من الخطة التجريبية إلى خطة مدفوعة في تقفيلة.",
    `الخطة الحالية: ${input.currentPlanName}`,
    ...buildOrganizationReferenceLines(input),
    "",
    "شكرًا.",
  ].join("\n");
}

export function buildUpgradeRequestWhatsAppMessage(input: UpgradeRequestMessageInput): string {
  return [
    `مرحبًا، أنا ${input.ownerName || "مالك النشاط"}.`,
    "",
    "أرغب بترقية اشتراك تقفيلة:",
    `الخطة الحالية: ${input.currentPlanName}`,
    `الخطة المطلوبة: ${input.targetPlanName}`,
    ...buildOrganizationReferenceLines(input),
    "",
    "شكرًا.",
  ].join("\n");
}

function formatBillingCycleLabelAr(billingCycle: string): string {
  return billingCycle === "yearly" ? "سنوي" : "شهري";
}

export function buildRenewalReminderWhatsAppMessage(input: RenewalReminderMessageInput): string {
  const organizationLine = input.organizationName?.trim()
    ? `النشاط: ${input.organizationName.trim()}`
    : "";
  const cycleLabel = formatBillingCycleLabelAr(input.billingCycle);
  const planName = input.planDisplayNameAr || input.planDisplayNameEn;
  const periodEndDate = new Date(input.periodEndIso);
  const periodEndLabel = Number.isNaN(periodEndDate.getTime())
    ? input.periodEndIso
    : periodEndDate.toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" });

  if (input.daysUntilEnd <= 0) {
    return [
      `مرحبًا، أنا ${input.ownerName || "مالك النشاط"}.`,
      "",
      "اشتراك تقفيلة منتهي أو يحتاج تجديد:",
      `الخطة: ${planName} (${cycleLabel})`,
      `تاريخ الانتهاء: ${periodEndLabel}`,
      organizationLine,
      "",
      "أرغب بتجديد الاشتراك. شكرًا.",
    ].filter(Boolean).join("\n");
  }

  return [
    `مرحبًا، أنا ${input.ownerName || "مالك النشاط"}.`,
    "",
    `تذكير: اشتراك تقفيلة ينتهي خلال ${input.daysUntilEnd} يوم.`,
    `الخطة: ${planName} (${cycleLabel})`,
    `تاريخ الانتهاء: ${periodEndLabel}`,
    organizationLine,
    "",
    "أرغب بتجديد الاشتراك. شكرًا.",
  ].filter(Boolean).join("\n");
}
