"use client";

import { FormEvent, useState } from "react";
import { resolveSaasAdminFormError, type SaasAdminFormError } from "@/features/saas-admin/client/api-error";
import {
  createSaasAccount,
  fetchPlanCatalog,
  type CreateSaasAccountResponse,
} from "@/features/saas-admin/client/saas-admin-api-client";
import { useSaasAdminQuery } from "@/features/saas-admin/client/use-saas-admin-query";
import type { translations } from "@/features/saas-admin/i18n/translations";

type SaasAdminTranslations = typeof translations.ar | typeof translations.en;

export function useNewAccountForm(t: SaasAdminTranslations) {
  const { data: planData } = useSaasAdminQuery(["saas-admin", "plans"], fetchPlanCatalog);
  const [organizationName, setOrganizationName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("");
  const [storeName, setStoreName] = useState("");
  const [storeLocation, setStoreLocation] = useState("");
  const [planCode, setPlanCode] = useState<"starter" | "growth" | "enterprise">("starter");
  const [error, setError] = useState<SaasAdminFormError | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdAccount, setCreatedAccount] = useState<CreateSaasAccountResponse | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const created = await createSaasAccount({
        organizationName,
        ownerName,
        ownerPhone,
        storeName: storeName || undefined,
        storeLocation: storeLocation || undefined,
        planCode,
      });
      setCreatedAccount(created);
    } catch (submitError) {
      setError(resolveSaasAdminFormError(submitError, t, t.newAccount.submitError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    planOptions: planData?.plans ?? [],
    organizationName,
    setOrganizationName,
    ownerName,
    setOwnerName,
    ownerPhone,
    setOwnerPhone,
    storeName,
    setStoreName,
    storeLocation,
    setStoreLocation,
    planCode,
    setPlanCode,
    error,
    isSubmitting,
    createdAccount,
    handleSubmit,
  };
}
