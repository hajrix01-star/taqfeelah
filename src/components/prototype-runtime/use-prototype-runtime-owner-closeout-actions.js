"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { resolveStoreChannelConfig } from "@/features/org-config/client/store-channel-config";
import { text } from "./prototype-runtime-demo-data";

export function usePrototypeRuntimeOwnerCloseoutActions({
  lang,
  entriesApiDbSource,
  runtimeApiStoresReady,
  activeViewBusiness,
  activeBusinesses,
  activeOwnerStoreId,
  storeChannelSettings,
  ownerApiUserId,
  currentOwnerActor,
  ownerProfile,
  ownerDisplayName,
  setOwnerPage,
  setQuickAddOpen,
  openQuickAddSummary,
  openQuickAddExpense,
  loadOperationalEntriesFromApi,
  removeOperationalEntriesForCloseout,
  syncCloseoutToOperationalEntries,
  setCloseoutAlerts,
  setOwnerManageCloseout,
}) {
  const ownerAddHandlerRef = useRef(null);
  const [ownerEntryActive, setOwnerEntryActive] = useState(false);
  const [ownerEditCloseout, setOwnerEditCloseout] = useState(null);

  const resolvedOwnerName = ownerProfile?.name?.trim() || ownerDisplayName || "";
  const ownerCloseoutActor = useMemo(() => ({
    id: ownerApiUserId || currentOwnerActor?.userId || "owner",
    apiUserId: ownerApiUserId,
    nameAr: resolvedOwnerName,
    nameEn: resolvedOwnerName,
    submitActorRole: "owner",
  }), [currentOwnerActor?.userId, ownerApiUserId, resolvedOwnerName]);

  const ownerCloseoutBusiness = useMemo(() => {
    const storeId = activeOwnerStoreId || activeBusinesses[0]?.id;
    return activeBusinesses.find((business) => business.id === storeId) || activeBusinesses[0] || null;
  }, [activeBusinesses, activeOwnerStoreId]);

  const ownerCloseoutChannelConfig = useMemo(
    () => resolveStoreChannelConfig(storeChannelSettings, ownerCloseoutBusiness?.id),
    [ownerCloseoutBusiness?.id, storeChannelSettings],
  );

  const homeReportChannelConfig = useMemo(
    () => resolveStoreChannelConfig(
      storeChannelSettings,
      activeViewBusiness === "all" ? activeBusinesses[0]?.id : activeViewBusiness,
    ),
    [activeBusinesses, activeViewBusiness, storeChannelSettings],
  );

  const openOwnerCloseoutEntry = useCallback(() => {
    if (!runtimeApiStoresReady) {
      window.alert(lang === "ar"
        ? "جاري تحميل إعدادات المحل من الخادم… انتظر لحظة ثم أعد المحاولة."
        : "Store settings are still loading from the server… wait a moment and try again.");
      return;
    }
    if (!ownerCloseoutBusiness?.id && activeBusinesses.length <= 1) {
      window.alert(text(lang, "chooseStoreForSummary"));
      return;
    }
    if (activeBusinesses.length === 0) {
      window.alert(text(lang, "chooseStoreForSummary"));
      return;
    }
    setQuickAddOpen(false);
    setOwnerPage("closeouts");
    window.requestAnimationFrame(() => {
      ownerAddHandlerRef.current?.();
    });
  }, [
    activeBusinesses.length,
    lang,
    ownerCloseoutBusiness?.id,
    runtimeApiStoresReady,
    setOwnerPage,
    setQuickAddOpen,
  ]);

  const handleOpenQuickAddSummary = useCallback(() => {
    if (entriesApiDbSource) {
      openOwnerCloseoutEntry();
      return;
    }
    openQuickAddSummary();
  }, [entriesApiDbSource, openOwnerCloseoutEntry, openQuickAddSummary]);

  const handleOpenQuickAddExpense = useCallback(() => {
    openQuickAddExpense();
  }, [openQuickAddExpense]);

  const handleOwnerQuickAddOpen = useCallback(() => {
    setQuickAddOpen(true);
  }, [setQuickAddOpen]);

  const handleOwnerCloseoutUpdated = useCallback(async (closeout) => {
    if (!closeout) return;
    if (closeout.status === "reviewed") {
      await syncCloseoutToOperationalEntries({ ...closeout, syncedToEntries: false }, { force: true });
      return;
    }
    if (entriesApiDbSource) {
      await loadOperationalEntriesFromApi();
      return;
    }
    removeOperationalEntriesForCloseout(closeout.id, closeout.storeId);
  }, [entriesApiDbSource, loadOperationalEntriesFromApi, removeOperationalEntriesForCloseout, syncCloseoutToOperationalEntries]);

  const handleOwnerCloseoutDeleted = useCallback(async (closeout) => {
    if (!closeout) return;
    if (entriesApiDbSource) {
      await loadOperationalEntriesFromApi();
    } else {
      removeOperationalEntriesForCloseout(closeout.id, closeout.storeId);
    }
    setCloseoutAlerts((current) => current.filter((item) => !(item.businessId === closeout.storeId && item.date === closeout.date)));
    setOwnerManageCloseout((current) => (current?.id === closeout.id ? null : current));
  }, [
    entriesApiDbSource,
    loadOperationalEntriesFromApi,
    removeOperationalEntriesForCloseout,
    setCloseoutAlerts,
    setOwnerManageCloseout,
  ]);

  return {
    ownerAddHandlerRef,
    ownerEntryActive,
    setOwnerEntryActive,
    ownerEditCloseout,
    setOwnerEditCloseout,
    ownerCloseoutActor,
    ownerCloseoutBusiness,
    ownerCloseoutChannelConfig,
    homeReportChannelConfig,
    openOwnerCloseoutEntry,
    handleOpenQuickAddSummary,
    handleOpenQuickAddExpense,
    handleOwnerQuickAddOpen,
    handleOwnerCloseoutUpdated,
    handleOwnerCloseoutDeleted,
  };
}
