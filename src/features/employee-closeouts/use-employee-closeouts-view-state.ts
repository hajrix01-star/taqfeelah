"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useDailyCloseouts } from "../daily-closeouts/DailyCloseoutsProvider";
import {
  createDraftCloseout,
  isCloseoutWorkflowFailure,
  sortCloseoutsNewestFirst,
  withCloseoutTotals,
} from "../daily-closeouts/daily-closeouts-local-store";
import { CLOSEOUT_STATUS } from "../daily-closeouts/closeout-status";
import {
  closeoutBelongsToEmployee,
  closeoutMatchesStore,
  employeeHistoryVisibilityLabel,
  isCloseoutWithinEmployeeHistory,
} from "./employee-closeout-history";
import { resolveEmployeeStoreName } from "./store-name-resolver";
import { countSentCloseoutsByDate } from "../closeouts/client/closeout-day-label";
import { isEmployeeCloseoutsListPending } from "./employee-closeouts-loading";
import { resolveEmployeeCloseoutsViewGate } from "./employee-closeouts-view-gate";
import { text } from "@/components/taqfeelah-app/taqfeelah-app-catalog-data";
import { appAlert, appConfirm } from "@/lib/ui/app-dialog/app-dialog-bridge";
import { triggerSubmitSuccessHaptic } from "./submit-success-haptic";
import type { DailyCloseoutRecord } from "../daily-closeouts/daily-closeouts-types";
import type { DisplayCloseout, ToggleAnchorRef, UseEmployeeCloseoutsViewStateParams } from "./employee-closeouts-types";
import type { CloseoutSalesChannelRow } from "../daily-closeouts/daily-closeouts-types";

function resolveScrollContainer(node: HTMLElement | null): HTMLElement | null {
  if (typeof window === "undefined" || !node) return null;
  let current = node.parentElement;
  while (current) {
    const styles = window.getComputedStyle(current);
    const canScrollY = /(auto|scroll)/.test(styles.overflowY) && current.scrollHeight > current.clientHeight;
    if (canScrollY) return current;
    current = current.parentElement;
  }
  return null;
}

function closeoutDraftHasEntryData(closeout: DailyCloseoutRecord | null | undefined): boolean {
  if (!closeout) return false;
  const sales = Object.values((closeout.sales && !Array.isArray(closeout.sales) ? closeout.sales : {}) as Record<string, CloseoutSalesChannelRow>)
    .some((row) => Number(row?.amount) > 0);
  const outflows = Array.isArray(closeout.outflows) && closeout.outflows.length > 0;
  const attachments = Array.isArray(closeout.attachments) && closeout.attachments.length > 0;
  return sales || outflows || attachments;
}

export function useEmployeeCloseoutsViewState({
  lang,
  employee,
  currentStore,
  assignedStores = [],
  onSelectStore,
  notebookTheme,
  employeeHistoryVisibility = "month",
  findForStoreDate: findForStoreDateProp,
  onRegisterAdd,
  onRegisterSettingsOpener,
  onEntryActiveChange,
  onCloseoutSubmitted,
  entryPhaseRef = null,
  employeeRuntimeReady = true,
  trustServerDaySequenceOnly = false,
  salesChannels = [],
}: UseEmployeeCloseoutsViewStateParams) {
  const {
    closeouts,
    upsertCloseout,
    deleteCloseout,
    submitCloseout,
    ownerEditCloseout,
    findForStoreDate,
    syncError,
    usesCloseoutsApi,
    closeoutsLoading,
    closeoutsLoaded,
    closeoutsHasData,
  } = useDailyCloseouts();

  const [entryCloseout, setEntryCloseout] = useState<DailyCloseoutRecord | null>(null);
  const [entryOwnerEdit, setEntryOwnerEdit] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [shareTarget, setShareTarget] = useState<DailyCloseoutRecord | null>(null);
  const [shareNewlySubmitted, setShareNewlySubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const cardRefs = useRef(new Map<string, HTMLElement>());
  const pendingToggleAnchorRef = useRef<ToggleAnchorRef>(null);
  const submitGenerationRef = useRef(0);

  const setCardRef = useCallback((closeoutId: string, node: HTMLElement | null) => {
    if (!closeoutId) return;
    if (node) cardRefs.current.set(closeoutId, node);
    else cardRefs.current.delete(closeoutId);
  }, []);

  const toggleExpandedCard = useCallback((closeoutId: string) => {
    const node = cardRefs.current.get(closeoutId);
    if (node) {
      pendingToggleAnchorRef.current = {
        closeoutId,
        top: node.getBoundingClientRect().top,
        scrollContainer: resolveScrollContainer(node),
      };
    } else {
      pendingToggleAnchorRef.current = null;
    }
    setExpandedId((current) => (current === closeoutId ? null : closeoutId));
  }, []);

  useLayoutEffect(() => {
    const anchor = pendingToggleAnchorRef.current;
    if (!anchor) return;
    pendingToggleAnchorRef.current = null;
    const node = cardRefs.current.get(anchor.closeoutId);
    if (!node) return;
    const delta = node.getBoundingClientRect().top - anchor.top;
    if (Math.abs(delta) < 1) return;
    if (anchor.scrollContainer) {
      anchor.scrollContainer.scrollTop += delta;
      return;
    }
    window.scrollBy(0, delta);
  }, [expandedId]);

  const myStoreCloseouts = useMemo(
    () => closeouts.filter(
      (item) => closeoutBelongsToEmployee(item, employee) && (
        assignedStores.length > 1
          ? assignedStores.some((store) => closeoutMatchesStore(item, store))
          : closeoutMatchesStore(item, currentStore)
      ),
    ),
    [assignedStores, closeouts, currentStore, employee],
  );

  const historyScopedCloseouts = useMemo(
    () => myStoreCloseouts.filter((item) => isCloseoutWithinEmployeeHistory(item, employeeHistoryVisibility)),
    [myStoreCloseouts, employeeHistoryVisibility],
  );

  const storeCloseouts = useMemo(
    () => sortCloseoutsNewestFirst(historyScopedCloseouts),
    [historyScopedCloseouts],
  );

  const hiddenCloseoutCount = useMemo(
    () => myStoreCloseouts.filter((item) => !isCloseoutWithinEmployeeHistory(item, employeeHistoryVisibility)).length,
    [myStoreCloseouts, employeeHistoryVisibility],
  );

  const hasOlderHiddenCloseouts = hiddenCloseoutCount > 0;
  const historyScopeLabel = employeeHistoryVisibilityLabel(employeeHistoryVisibility, lang);

  const sameDayCloseoutCountByDate = useMemo(
    () => countSentCloseoutsByDate(myStoreCloseouts),
    [myStoreCloseouts],
  );

  const dailySequenceById = useMemo(() => {
    if (trustServerDaySequenceOnly) return new Map();
    const byDate = new Map();
    myStoreCloseouts.forEach((item) => {
      const list = byDate.get(item.date) || [];
      list.push(item);
      byDate.set(item.date, list);
    });
    const serialMap = new Map();
    byDate.forEach((items) => {
      const ordered = [...items].sort((a, b) => {
        const aTime = a.submittedAt || a.openedAt || "";
        const bTime = b.submittedAt || b.openedAt || "";
        if (aTime !== bTime) return aTime < bTime ? -1 : 1;
        return String(a.id).localeCompare(String(b.id));
      });
      ordered.forEach((item, index) => serialMap.set(item.id, index + 1));
    });
    return serialMap;
  }, [myStoreCloseouts, trustServerDaySequenceOnly]);

  const displayCloseouts = useMemo((): DisplayCloseout[] => {
    if (!storeCloseouts.length) return [];
    return storeCloseouts.map((item, index) => ({
      ...item,
      uiExpanded: expandedId === item.id,
      isPrevious: index > 0,
      dailySequence: trustServerDaySequenceOnly
        ? (Number.isInteger(item.daySequence) ? item.daySequence : null)
        : (item.daySequence ?? dailySequenceById.get(item.id) ?? null),
    }));
  }, [storeCloseouts, expandedId, dailySequenceById, trustServerDaySequenceOnly]);

  const currentStoreId = currentStore?.id || null;
  const storeLabel = useMemo(() => resolveEmployeeStoreName(currentStore, lang), [currentStore, lang]);

  const openSettings = useCallback(() => setShowSettings(true), []);

  const startNewCloseout = useCallback(async () => {
    if (!employeeRuntimeReady) {
      await appAlert({ lang, title: text(lang, "storeSettingsLoadingRetry"), variant: "info" });
      return;
    }
    const stores = assignedStores.length > 0
      ? assignedStores
      : currentStore ? [currentStore] : [];
    if (!stores.length) return;

    const today = new Date();
    const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    setEntryOwnerEdit(false);

    const autoStore = stores.length === 1 ? stores[0] : null;
    const draft = createDraftCloseout({
      storeId: autoStore?.id || "",
      storeName: autoStore ? resolveEmployeeStoreName(autoStore, lang) : "",
      date: todayIso,
      employee: { id: employee.id || "", nameAr: employee.nameAr, nameEn: employee.nameEn },
      notebookTheme,
    });
    setEntryCloseout(upsertCloseout(draft));
  }, [assignedStores, currentStore, employee, employeeRuntimeReady, lang, notebookTheme, upsertCloseout]);

  const handleEntryStoreSelect = useCallback(async (storeId: string) => {
    if (!entryCloseout || !storeId) return;
    if (entryCloseout.storeId === storeId) return;

    const store = assignedStores.find((item) => item.id === storeId)
      || (currentStore?.id === storeId ? currentStore : null);
    if (!store) return;

    if (closeoutDraftHasEntryData(entryCloseout) && !(await appConfirm({
      lang,
      title: text(lang, "discardCloseoutDraftOnStoreChange"),
      confirmLabel: text(lang, "dialogOk"),
      cancelLabel: text(lang, "cancel"),
      variant: "warning",
    }))) {
      return;
    }

    const nextCloseout = withCloseoutTotals({
      ...entryCloseout,
      storeId: store.id,
      storeName: resolveEmployeeStoreName(store, lang),
      sales: {},
      outflows: [],
      attachments: [],
    });
    setEntryCloseout(upsertCloseout(nextCloseout));
    onSelectStore?.(store.id);
  }, [assignedStores, currentStore, entryCloseout, lang, onSelectStore, upsertCloseout]);

  useEffect(() => {
    onRegisterAdd?.(() => {
      if (entryPhaseRef?.current) entryPhaseRef.current = null;
      startNewCloseout();
    });
    return () => onRegisterAdd?.(null);
  }, [entryPhaseRef, onRegisterAdd, startNewCloseout]);

  useEffect(() => {
    onRegisterSettingsOpener?.(openSettings);
    return () => onRegisterSettingsOpener?.(null);
  }, [onRegisterSettingsOpener, openSettings]);

  useEffect(() => {
    onEntryActiveChange?.(Boolean(entryCloseout) || showSettings);
    return () => onEntryActiveChange?.(false);
  }, [entryCloseout, showSettings, onEntryActiveChange]);

  const resolveStoreDate = useCallback((date: string) => {
    const storeId = entryCloseout?.storeId || currentStoreId;
    if (!storeId) return null;
    return (findForStoreDateProp || findForStoreDate)(storeId, date);
  }, [currentStoreId, entryCloseout?.storeId, findForStoreDateProp, findForStoreDate]);

  const handleSubmit = async (closeout: DailyCloseoutRecord, { isOwnerEdit }: { isOwnerEdit: boolean }) => {
    const generation = ++submitGenerationRef.current;
    setSubmitting(true);
    try {
      const fn = isOwnerEdit ? ownerEditCloseout : submitCloseout;
      const next = await fn({ closeout, employee });
      if (generation !== submitGenerationRef.current) return;
      if (isCloseoutWorkflowFailure(next)) {
        const fallback = next.phase === "save"
          ? (lang === "ar" ? "تعذر الحفظ." : "Failed to save.")
          : (lang === "ar" ? "تعذر الإرسال." : "Failed to send.");
        await appAlert({ lang, title: syncError || fallback, variant: "danger" });
        return;
      }
      if (!next) {
        await appAlert({ lang, title: syncError || text(lang, "closeoutSendFailed"), variant: "danger" });
        return;
      }
      triggerSubmitSuccessHaptic();
      setShareTarget(next);
      setShareNewlySubmitted(true);
      window.setTimeout(() => {
        setEntryCloseout(null);
        setEntryOwnerEdit(false);
        setExpandedId(null);
      }, 320);
    } finally {
      if (generation === submitGenerationRef.current) {
        setSubmitting(false);
      }
    }
  };

  const handleCancelEntry = (closeout: DailyCloseoutRecord | null | undefined) => {
    if (submitting) return;
    submitGenerationRef.current += 1;
    if (closeout?.status === CLOSEOUT_STATUS.DRAFT && !closeout.submittedAt) {
      void deleteCloseout(closeout.id || "");
    }
    setEntryCloseout(null);
    setEntryOwnerEdit(false);
  };

  const viewGate = resolveEmployeeCloseoutsViewGate({
    employeeRuntimeReady,
    currentStore,
    assignedStores,
  });
  const channelsReady = salesChannels.length > 0;
  const closeoutsLoadFailed = usesCloseoutsApi && Boolean(syncError) && !closeoutsLoaded && !closeoutsHasData;
  const closeoutsListPending = isEmployeeCloseoutsListPending({
    apiEnabled: usesCloseoutsApi,
    loading: closeoutsLoading,
    loaded: closeoutsLoaded,
    hasCachedCloseouts: closeoutsHasData,
    loadFailed: closeoutsLoadFailed,
  });
  const closeShareModal = useCallback(() => {
    setShareNewlySubmitted((wasNew) => {
      if (wasNew) onCloseoutSubmitted?.();
      return false;
    });
    setShareTarget(null);
    setEntryCloseout(null);
    setEntryOwnerEdit(false);
  }, [onCloseoutSubmitted]);

  return {
    viewGate,
    entryCloseout,
    entryOwnerEdit,
    showSettings,
    setShowSettings,
    shareTarget,
    shareNewlySubmitted,
    storeLabel,
    displayCloseouts,
    sameDayCloseoutCountByDate,
    hasOlderHiddenCloseouts,
    historyScopeLabel,
    hiddenCloseoutCount,
    syncError,
    employeeRuntimeReady,
    channelsReady,
    closeoutsListPending,
    setCardRef,
    toggleExpandedCard,
    handleSubmit,
    handleCancelEntry,
    resolveStoreDate,
    handleEntryStoreSelect,
    setShareTarget,
    setShareNewlySubmitted,
    closeShareModal,
    submitting,
  };
}
