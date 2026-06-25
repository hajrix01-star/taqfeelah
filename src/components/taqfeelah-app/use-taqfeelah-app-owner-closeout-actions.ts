"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { resolveStoreChannelConfig, EMPTY_STORE_CHANNEL_CONFIG } from "@/features/org-config/client/store-channel-config";
import { text } from "./taqfeelah-app-demo-data";
import { appAlert } from "@/lib/ui/app-dialog/app-dialog-bridge";
import { refreshOperationalEntriesBestEffort } from "@/features/operations/client/refresh-operational-entries-best-effort";
import type {
  PrototypeCloseoutRecord,
  UseTaqfeelahAppOwnerCloseoutActionsProps,
} from "./taqfeelah-app-types";

export function shouldOpenOwnerCloseoutEntryForQuickExpense({
  entriesApiDbSource,
}: {
  entriesApiDbSource: boolean;
}) {
  return entriesApiDbSource;
}

export function useTaqfeelahAppOwnerCloseoutActions({
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
}: UseTaqfeelahAppOwnerCloseoutActionsProps) {
  const ownerAddHandlerRef = useRef<(() => void) | null>(null);
  const [ownerEntryActive, setOwnerEntryActive] = useState(false);
  const [ownerEditCloseout, setOwnerEditCloseout] = useState<PrototypeCloseoutRecord | null>(null);

  const resolvedOwnerName = String(ownerProfile?.name || "").trim() || ownerDisplayName || "";
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
    () => resolveStoreChannelConfig(storeChannelSettings, ownerCloseoutBusiness?.id, EMPTY_STORE_CHANNEL_CONFIG),
    [ownerCloseoutBusiness?.id, storeChannelSettings],
  );

  const homeReportChannelConfig = useMemo(
    () => resolveStoreChannelConfig(
      storeChannelSettings,
      activeViewBusiness === "all" ? activeBusinesses[0]?.id : activeViewBusiness,
      EMPTY_STORE_CHANNEL_CONFIG,
    ),
    [activeBusinesses, activeViewBusiness, storeChannelSettings],
  );

  const openOwnerCloseoutEntry = useCallback(async () => {
    if (!runtimeApiStoresReady) {
      await appAlert({ lang, title: text(lang, "storeSettingsLoadingRetry"), variant: "info" });
      return;
    }
    if (!ownerCloseoutBusiness?.id && activeBusinesses.length <= 1) {
      await appAlert({ lang, title: text(lang, "chooseStoreForSummary"), variant: "info" });
      return;
    }
    if (activeBusinesses.length === 0) {
      await appAlert({ lang, title: text(lang, "chooseStoreForSummary"), variant: "info" });
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
    if (shouldOpenOwnerCloseoutEntryForQuickExpense({ entriesApiDbSource })) {
      openOwnerCloseoutEntry();
      return;
    }
    openQuickAddExpense();
  }, [entriesApiDbSource, openOwnerCloseoutEntry, openQuickAddExpense]);

  const handleOwnerQuickAddOpen = useCallback(() => {
    setQuickAddOpen(true);
  }, [setQuickAddOpen]);

  const handleOwnerCloseoutUpdated = useCallback(async (closeout: PrototypeCloseoutRecord) => {
    if (!closeout) return;
    if (closeout.status === "reviewed") {
      await syncCloseoutToOperationalEntries({ ...closeout, syncedToEntries: false }, { force: true });
      return;
    }
    if (entriesApiDbSource) {
      await refreshOperationalEntriesBestEffort(loadOperationalEntriesFromApi);
      return;
    }
    removeOperationalEntriesForCloseout(closeout.id || "", closeout.storeId);
  }, [entriesApiDbSource, loadOperationalEntriesFromApi, removeOperationalEntriesForCloseout, syncCloseoutToOperationalEntries]);

  const handleOwnerCloseoutDeleted = useCallback(async (closeout: PrototypeCloseoutRecord) => {
    if (!closeout) return;
    if (entriesApiDbSource) {
      await refreshOperationalEntriesBestEffort(loadOperationalEntriesFromApi);
    } else {
      removeOperationalEntriesForCloseout(closeout.id || "", closeout.storeId);
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
