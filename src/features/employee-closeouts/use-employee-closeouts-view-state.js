"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useDailyCloseouts } from "../daily-closeouts/DailyCloseoutsProvider";
import {
  createDraftCloseout,
  isCloseoutWorkflowFailure,
  sortCloseoutsNewestFirst,
} from "../daily-closeouts/daily-closeouts-demo-store";
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

function resolveScrollContainer(node) {
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

export function useEmployeeCloseoutsViewState({
  lang,
  employee,
  currentStore,
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
}) {
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

  const [entryCloseout, setEntryCloseout] = useState(null);
  const [entryOwnerEdit, setEntryOwnerEdit] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [shareTarget, setShareTarget] = useState(null);
  const [shareNewlySubmitted, setShareNewlySubmitted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const cardRefs = useRef(new Map());
  const pendingToggleAnchorRef = useRef(null);

  const setCardRef = useCallback((closeoutId, node) => {
    if (!closeoutId) return;
    if (node) cardRefs.current.set(closeoutId, node);
    else cardRefs.current.delete(closeoutId);
  }, []);

  const toggleExpandedCard = useCallback((closeoutId) => {
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
      (item) => closeoutMatchesStore(item, currentStore) && closeoutBelongsToEmployee(item, employee),
    ),
    [closeouts, currentStore, employee],
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

  const displayCloseouts = useMemo(() => {
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

  const startNewCloseout = useCallback(() => {
    if (!employeeRuntimeReady) {
      window.alert(lang === "ar"
        ? "جاري تحميل إعدادات المحل من الخادم… انتظر لحظة ثم أعد المحاولة."
        : "Store settings are still loading from the server… wait a moment and try again.");
      return;
    }
    if (!currentStoreId) return;
    const today = new Date();
    const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    setEntryOwnerEdit(false);
    const draft = createDraftCloseout({
      storeId: currentStoreId,
      storeName: storeLabel,
      date: todayIso,
      employee: { id: employee.id, nameAr: employee.nameAr, nameEn: employee.nameEn },
      notebookTheme,
    });
    setEntryCloseout(upsertCloseout(draft));
  }, [currentStoreId, employee, employeeRuntimeReady, lang, storeLabel, notebookTheme, upsertCloseout]);

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

  const resolveStoreDate = useCallback((date) => {
    if (!currentStoreId) return null;
    return (findForStoreDateProp || findForStoreDate)(currentStoreId, date);
  }, [currentStoreId, findForStoreDateProp, findForStoreDate]);

  const handleSubmit = async (closeout, { isOwnerEdit }) => {
    const fn = isOwnerEdit ? ownerEditCloseout : submitCloseout;
    const next = await fn({ closeout, employee });
    if (isCloseoutWorkflowFailure(next)) {
      const fallback = next.phase === "save"
        ? (lang === "ar" ? "تعذر الحفظ." : "Failed to save.")
        : (lang === "ar" ? "تعذر الإرسال." : "Failed to send.");
      window.alert(syncError || fallback);
      return;
    }
    if (!next) {
      window.alert(syncError || (lang === "ar" ? "تعذر الإرسال." : "Failed to send."));
      return;
    }
    setEntryCloseout(null);
    setEntryOwnerEdit(false);
    setExpandedId(null);
    setShareTarget(next);
    setShareNewlySubmitted(true);
    onCloseoutSubmitted?.(next);
  };

  const handleCancelEntry = (closeout) => {
    if (closeout?.status === CLOSEOUT_STATUS.DRAFT && !closeout.submittedAt) {
      deleteCloseout(closeout.id);
    }
    setEntryCloseout(null);
    setEntryOwnerEdit(false);
  };

  const viewGate = resolveEmployeeCloseoutsViewGate({ employeeRuntimeReady, currentStore });
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
    setShareTarget(null);
    setShareNewlySubmitted(false);
  }, []);

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
    setShareTarget,
    setShareNewlySubmitted,
    closeShareModal,
  };
}
