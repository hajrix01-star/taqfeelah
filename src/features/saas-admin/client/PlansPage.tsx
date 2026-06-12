"use client";

import { AdminErrorAlert } from "@/features/saas-admin/components/AdminErrorAlert";
import { AdminHeader } from "@/features/saas-admin/components/AdminHeader";
import { AdminPageBody } from "@/features/saas-admin/components/AdminPageBody";
import { LoadingSkeleton } from "@/features/saas-admin/components/LoadingSkeleton";
import { usePlanCatalogAdmin } from "@/features/billing/client/use-plan-catalog-admin";
import { PlanEditor } from "@/features/saas-admin/client/PlanEditor";
import { useSaasAdminLocale } from "@/features/saas-admin/i18n/SaasAdminLocaleProvider";

export default function PlansPage() {
  const { t } = useSaasAdminLocale();
  const { plans, isLoading, error, saveError, savingPlanCode, savePlan } = usePlanCatalogAdmin();

  if (isLoading) return <LoadingSkeleton />;

  return (
    <>
      <AdminHeader title={t.plansPage.title} description={t.plansPage.description} />
      <AdminPageBody className="space-y-4">
        {error ? (
          <AdminErrorAlert
            message={error instanceof Error ? error.message : t.plansPage.loadError}
          />
        ) : null}
        {saveError ? <AdminErrorAlert message={saveError} /> : null}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {plans.map((plan) => (
            <PlanEditor
              key={plan.planCode}
              plan={plan}
              saving={savingPlanCode === plan.planCode}
              onSave={savePlan}
            />
          ))}
        </div>
      </AdminPageBody>
    </>
  );
}
