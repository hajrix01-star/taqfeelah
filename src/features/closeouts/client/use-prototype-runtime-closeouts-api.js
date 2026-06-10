"use client";

import { useCallback } from "react";
import {
  buildCloseoutSubmitFailureMessage,
  diagnoseCloseoutSubmitFailure,
  fetchStoreCloseoutsViaApi,
  hasCloseoutApiActorMapping,
  hasCloseoutApiStoreMapping,
  isUuid,
  submitCloseoutViaApi,
} from "@/features/closeouts/client/closeouts-api-client";
import { refreshOperationalEntriesBestEffort } from "@/features/operations/client/refresh-operational-entries-best-effort";

export function usePrototypeRuntimeCloseoutsApi({
  lang,
  closeoutsApiEnabled,
  closeoutsApiStrictMode,
  closeoutsApiOrganizationId,
  apiActorUserId,
  apiActorRole,
  apiTargetStoreIdsKey,
  entriesApiEnabled,
  loadOperationalEntriesFromApi,
  currentEmployeeChannelConfig,
  ownerCloseoutBusiness,
  ownerCloseoutChannelConfig,
}) {
  const syncSubmitCloseoutToApi = useCallback(async ({ action, closeout, employee }) => {
    if (!closeoutsApiEnabled) {
      throw new Error(lang === "ar"
        ? "مسار API للتقفيلات غير مفعّل."
        : "Closeouts API is disabled.");
    }
    const actorUserId = employee?.apiUserId || employee?.id;
    const storeChannels = currentEmployeeChannelConfig?.channels || [];
    const isOwnerSubmit = employee?.submitActorRole === "owner";
    const ownerStoreChannels = isOwnerSubmit && ownerCloseoutBusiness?.id === closeout?.storeId
      ? (ownerCloseoutChannelConfig?.channels || [])
      : storeChannels;
    const submitFailure = diagnoseCloseoutSubmitFailure({
      organizationId: closeoutsApiOrganizationId,
      actorUserId,
      closeout,
      storeChannels: isOwnerSubmit ? ownerStoreChannels : storeChannels,
    });
    if (submitFailure) {
      throw new Error(buildCloseoutSubmitFailureMessage(submitFailure, lang));
    }
    if (
      !isUuid(closeoutsApiOrganizationId)
      || !hasCloseoutApiActorMapping(actorUserId)
      || !hasCloseoutApiStoreMapping(closeout?.storeId)
    ) {
      throw new Error(lang === "ar"
        ? "تعذر إرسال التقفيلة: سياق API غير مكتمل (منظمة/مستخدم/محل)."
        : "Closeout submit blocked: API context is incomplete (organization/user/store).");
    }
    const result = await submitCloseoutViaApi({
      organizationId: closeoutsApiOrganizationId,
      actorUserId,
      actorRole: isOwnerSubmit ? "owner" : "employee",
      closeout,
      storeChannels: isOwnerSubmit ? ownerStoreChannels : storeChannels,
      mode: action === "resubmit" ? "resubmit" : "submit",
    });
    if (!result) {
      throw new Error(lang === "ar"
        ? "تعذر إرسال التقفيلة: لم يُرجع الخادم تأكيدًا."
        : "Closeout submit failed: server returned an empty response.");
    }
    if (entriesApiEnabled) {
      await refreshOperationalEntriesBestEffort(loadOperationalEntriesFromApi);
    }
    return result;
  }, [
    closeoutsApiEnabled,
    closeoutsApiOrganizationId,
    currentEmployeeChannelConfig?.channels,
    entriesApiEnabled,
    lang,
    loadOperationalEntriesFromApi,
    ownerCloseoutBusiness?.id,
    ownerCloseoutChannelConfig?.channels,
  ]);

  const loadCloseoutsFromApi = useCallback(async () => {
    if (!closeoutsApiEnabled) {
      if (closeoutsApiStrictMode) throw new Error("closeouts API is disabled in production mode.");
      return [];
    }
    if (!isUuid(closeoutsApiOrganizationId)) {
      throw new Error(
        lang === "ar"
          ? "تعذر تحميل التقفيلات: معرف المنظمة غير صالح لمسار API."
          : "Failed to load closeouts: organization id is missing/invalid for closeouts API.",
      );
    }

    if (!hasCloseoutApiActorMapping(apiActorUserId)) {
      throw new Error(
        lang === "ar"
          ? "تعذر تحميل التقفيلات: معرف المستخدم غير مربوط بالخادم."
          : "Failed to load closeouts: actor user id is missing/invalid for closeouts API.",
      );
    }

    const targetStoreIds = apiTargetStoreIdsKey ? apiTargetStoreIdsKey.split("|").filter(Boolean) : [];
    if (!targetStoreIds.length) {
      throw new Error(
        lang === "ar"
          ? "تعذر تحميل التقفيلات: لا يوجد محل مربوط بالخادم لهذا السياق."
          : "Failed to load closeouts: no store id is mapped for this API context.",
      );
    }

    const fetched = await Promise.all(
      targetStoreIds.map((storeId) => fetchStoreCloseoutsViaApi({
        organizationId: closeoutsApiOrganizationId,
        actorUserId: apiActorUserId,
        actorRole: apiActorRole,
        storeId,
      })),
    );

    const merged = fetched.flatMap((items) => (Array.isArray(items) ? items : []));
    const seen = new Set();
    return merged.filter((item) => {
      const itemId = typeof item?.id === "string" ? item.id : "";
      const itemDate = typeof item?.date === "string" ? item.date : "";
      if (!itemId || !itemDate) return false;
      const key = `${itemId}:${itemDate}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [
    apiActorRole,
    apiActorUserId,
    apiTargetStoreIdsKey,
    closeoutsApiEnabled,
    closeoutsApiOrganizationId,
    closeoutsApiStrictMode,
    lang,
  ]);

  return {
    syncSubmitCloseoutToApi,
    loadCloseoutsFromApi,
  };
}
