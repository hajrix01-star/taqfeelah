"use client";

import { useCallback, useState } from "react";
import type { PlanCatalogRow } from "@/features/billing/types";
import {
  fetchPlanCatalog,
  updatePlanCatalogRow,
} from "@/features/saas-admin/client/saas-admin-api-client";
import { useSaasAdminQuery } from "@/features/saas-admin/client/use-saas-admin-query";

export function usePlanCatalogAdmin() {
  const { data, error, isLoading, refetch } = useSaasAdminQuery(
    ["saas-admin", "plans"],
    fetchPlanCatalog,
  );
  const [savingPlanCode, setSavingPlanCode] = useState<string | null>(null);
  const [saveError, setSaveError] = useState("");

  const plans = data?.plans ?? [];

  const savePlan = useCallback(async (row: PlanCatalogRow) => {
    setSaveError("");
    setSavingPlanCode(row.planCode);
    try {
      await updatePlanCatalogRow(row);
      await refetch();
    } catch (failure) {
      setSaveError(failure instanceof Error ? failure.message : "Failed to save plan.");
      throw failure;
    } finally {
      setSavingPlanCode(null);
    }
  }, [refetch]);

  return {
    plans,
    isLoading,
    error,
    saveError,
    savingPlanCode,
    savePlan,
    refetch,
  };
}
