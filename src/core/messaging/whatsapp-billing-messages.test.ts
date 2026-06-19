import { describe, expect, it } from "vitest";
import {
  buildUpgradeRequestWhatsAppMessage,
  buildUpgradeToPaidWhatsAppMessage,
} from "@/core/messaging/whatsapp-billing-messages";

describe("whatsapp billing messages account number", () => {
  it("includes numeric account number in upgrade request", () => {
    const message = buildUpgradeRequestWhatsAppMessage({
      ownerName: "محمد",
      organizationName: "تجربة تسجيل",
      accountNumber: 100042,
      currentPlanName: "تجربة مجانية",
      targetPlanName: "أساسية",
    });
    expect(message).toContain("رقم الحساب: 100042");
    expect(message).toContain("النشاط: تجربة تسجيل");
  });

  it("includes numeric account number in trial to paid message", () => {
    const message = buildUpgradeToPaidWhatsAppMessage({
      ownerName: "محمد",
      currentPlanName: "تجربة مجانية",
      organizationName: "تجربة تسجيل",
      accountNumber: 100043,
    });
    expect(message).toContain("رقم الحساب: 100043");
  });
});
