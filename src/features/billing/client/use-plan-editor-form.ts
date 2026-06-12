"use client";

import { FormEvent, useState } from "react";
import { halalasToSar, sarToHalalas } from "@/features/billing/client/plan-price-utils";
import type { PlanCatalogRow } from "@/features/billing/types";

export function usePlanEditorForm(
  plan: PlanCatalogRow,
  onSave: (row: PlanCatalogRow) => Promise<void>,
) {
  const [displayNameAr, setDisplayNameAr] = useState(plan.displayNameAr);
  const [displayNameEn, setDisplayNameEn] = useState(plan.displayNameEn);
  const [priceMonthly, setPriceMonthly] = useState(halalasToSar(plan.priceMonthlyHalalas));
  const [maxStores, setMaxStores] = useState(String(plan.maxStores));
  const [maxEmployees, setMaxEmployees] = useState(String(plan.maxEmployees));
  const [trialDays, setTrialDays] = useState(String(plan.trialDays));
  const [isActive, setIsActive] = useState(plan.isActive);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSave({
      ...plan,
      displayNameAr: displayNameAr.trim(),
      displayNameEn: displayNameEn.trim(),
      priceMonthlyHalalas: sarToHalalas(priceMonthly),
      maxStores: Number(maxStores) || 1,
      maxEmployees: Number(maxEmployees) || 1,
      trialDays: Number(trialDays) || 14,
      isActive,
    });
  }

  return {
    displayNameAr,
    setDisplayNameAr,
    displayNameEn,
    setDisplayNameEn,
    priceMonthly,
    setPriceMonthly,
    maxStores,
    setMaxStores,
    maxEmployees,
    setMaxEmployees,
    trialDays,
    setTrialDays,
    isActive,
    setIsActive,
    submit,
  };
}
