import type { PlanCatalogRow, PlanFeatureLabel } from "@/features/billing/types";

export function buildPlanFeatureLabels(plan: Pick<
  PlanCatalogRow,
  "maxStores" | "maxEmployees" | "trialDays" | "features"
>): PlanFeatureLabel[] {
  const features: PlanFeatureLabel[] = [];

  if (plan.features.isTrialPlan === true) {
    features.push({
      key: "isTrialPlan",
      labelAr: "خطة تجريبية مجانية",
      labelEn: "Free trial plan",
    });
  }

  features.push(
    {
      key: "maxStores",
      labelAr: plan.maxStores === 1 ? "محل واحد" : `حتى ${plan.maxStores} محلات`,
      labelEn: plan.maxStores === 1 ? "1 store" : `Up to ${plan.maxStores} stores`,
    },
    {
      key: "maxEmployees",
      labelAr: plan.maxEmployees === 1 ? "موظف واحد" : `حتى ${plan.maxEmployees} موظف`,
      labelEn: plan.maxEmployees === 1 ? "1 employee" : `Up to ${plan.maxEmployees} employees`,
    },
  );

  if (plan.features.multiStore === true) {
    features.push({
      key: "multiStore",
      labelAr: "إدارة محلات متعددة",
      labelEn: "Multi-store management",
    });
  }

  if (plan.features.customContract === true) {
    features.push({
      key: "customContract",
      labelAr: "عقد وميزات حسب الطلب",
      labelEn: "Custom contract and features",
    });
  }

  if (plan.trialDays > 0) {
    features.push({
      key: "trialDuration",
      labelAr: `مدة التجربة ${plan.trialDays} يوم`,
      labelEn: `${plan.trialDays}-day trial period`,
    });
  }

  return features;
}
