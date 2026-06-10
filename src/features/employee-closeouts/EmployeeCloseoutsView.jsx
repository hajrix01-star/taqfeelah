"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import NotebookScrollSurface from "../daily-closeouts/NotebookScrollSurface";
import DailyCloseoutCard from "./DailyCloseoutCard";
import DailyCloseoutEntryFlow from "./DailyCloseoutEntryFlow";
import CloseoutShareModal from "./CloseoutShareModal";
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
import { resolveCloseoutStoreName, resolveEmployeeStoreName } from "./store-name-resolver";
import { countSubmittedCloseoutsByDate } from "../closeouts/client/closeout-day-label";

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

export default function EmployeeCloseoutsView({
  lang,
  employee,
  currentStore,
  assignedStores,
  onSelectStore,
  salesChannels,
  notebookTheme,
  employeeHistoryVisibility = "all",
  formatCalendarDate,
  channelLabel,
  settingsPanel,
  onRegisterAdd,
  onRegisterSettingsOpener,
  onEntryActiveChange,
  onCloseoutSubmitted,
  findForStoreDate: findForStoreDateProp,
  saving,
  employeeRuntimeReady = true,
  trustServerDaySequenceOnly = false,
  entryPhaseRef = null,
  pageTitle = "",
  showStorePicker = true,
}) {
  const {
    closeouts,
    upsertCloseout,
    deleteCloseout,
    submitCloseout,
    resubmitCloseout,
    findForStoreDate,
    syncError,
  } = useDailyCloseouts();

  const [entryCloseout, setEntryCloseout] = useState(null);
  const [entryResubmit, setEntryResubmit] = useState(false);
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

  const storeCloseouts = useMemo(
    () => sortCloseoutsNewestFirst(myStoreCloseouts.filter((item) => isCloseoutWithinEmployeeHistory(item, employeeHistoryVisibility))),
    [myStoreCloseouts, employeeHistoryVisibility],
  );

  const hiddenCloseoutCount = useMemo(
    () => myStoreCloseouts.filter((item) => !isCloseoutWithinEmployeeHistory(item, employeeHistoryVisibility)).length,
    [myStoreCloseouts, employeeHistoryVisibility],
  );

  const hasOlderHiddenCloseouts = hiddenCloseoutCount > 0;
  const historyScopeLabel = employeeHistoryVisibilityLabel(employeeHistoryVisibility, lang);

  const sameDayCloseoutCountByDate = useMemo(
    () => countSubmittedCloseoutsByDate(myStoreCloseouts),
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
    setEntryResubmit(false);
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

  const resolveStoreDate = (date) => {
    if (!currentStoreId) return null;
    return (findForStoreDateProp || findForStoreDate)(currentStoreId, date);
  };

  const handleSubmit = async (closeout, { isResubmit }) => {
    const fn = isResubmit ? resubmitCloseout : submitCloseout;
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
    setEntryResubmit(false);
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
    setEntryResubmit(false);
  };

  if (!currentStore) {
    return (
      <section className="px-5 pb-28">
        <div className="rounded-3xl bg-white p-8 text-center text-sm font-bold text-[#827762] ring-1 ring-black/[0.045]">
          {lang === "ar" ? "لا يوجد محل مرتبط" : "No linked store"}
        </div>
      </section>
    );
  }

  if (entryCloseout) {
    return (
      <DailyCloseoutEntryFlow
        lang={lang}
        notebookTheme={notebookTheme}
        closeout={entryCloseout}
        salesChannels={salesChannels}
        storeName={storeLabel}
        isResubmit={entryResubmit}
        saving={saving}
        channelLabel={channelLabel}
        onCancel={() => handleCancelEntry(entryCloseout)}
        onSubmit={handleSubmit}
        findForStoreDate={resolveStoreDate}
      />
    );
  }

  const channelsReady = salesChannels.length > 0;

  return (
    <>
      <NotebookScrollSurface theme={notebookTheme} lang={lang}>
        {showSettings && settingsPanel ? (
          settingsPanel({ onBack: () => setShowSettings(false) })
        ) : (
          <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="taq-owner-page taq-notebook-body pb-28 pt-1">
            <h1 className="relative mx-auto mb-6 w-fit pb-3 text-center text-taq-hero font-extrabold tracking-tight text-[#112A46] after:absolute after:bottom-0 after:left-1/2 after:h-0.5 after:w-[68px] after:-translate-x-1/2 after:bg-[#D69C2F]">
              {pageTitle || (lang === "ar" ? "تقفيلاتي اليومية" : "My daily closeouts")}
            </h1>
            {!employeeRuntimeReady && (
              <div className="mb-4 rounded-2xl bg-[#FFF4D2]/95 p-3 text-taq-meta font-bold text-[#806528] ring-1 ring-[#E8E1D4] backdrop-blur-sm">
                {lang === "ar" ? "جاري تحميل إعدادات المحل وقنوات البيع من الخادم…" : "Loading store settings and sales channels from the server…"}
              </div>
            )}
            {employeeRuntimeReady && !channelsReady && (
              <div className="mb-4 rounded-2xl bg-[#FFF1EE]/90 p-3 text-taq-meta font-bold text-[#B44747] ring-1 ring-[#B44747]/10 backdrop-blur-sm">
                {lang === "ar" ? "لا توجد قنوات بيع مفعّلة لهذا المحل. اطلب من المالك تفعيلها من الإعدادات." : "No active sales channels for this store. Ask the owner to enable them in settings."}
              </div>
            )}
            {syncError ? (
              <div className="mb-4 rounded-2xl bg-[#FFF1EE]/90 p-3 text-taq-meta font-bold text-[#B44747] ring-1 ring-[#B44747]/10 backdrop-blur-sm">
                {syncError}
              </div>
            ) : null}
            {hasOlderHiddenCloseouts && employeeHistoryVisibility !== "all" && (
              <div className="mb-4 rounded-2xl bg-[#FFF4D2]/95 p-3 text-taq-meta font-bold leading-5 text-[#806528] ring-1 ring-[#E8E1D4] backdrop-blur-sm">
                {lang === "ar" ? (
                  <>
                    <p>
                      يعرض المالك للموظف تقفيلات آخر <strong className="text-[#112A46]">{historyScopeLabel}</strong> فقط (
                      {hiddenCloseoutCount} تقفيلة أقدم مخفية).
                    </p>
                    <p className="mt-2 text-taq-nav">
                      لتظهر كل التقفيلات السابقة: الإعدادات → المحل → مراجعة الصور والتنبيهات → اختر «الكل» ثم احفظ.
                    </p>
                  </>
                ) : (
                  <>
                    <p>
                      Owner limits history to the last <strong className="text-[#112A46]">{historyScopeLabel}</strong> (
                      {hiddenCloseoutCount} older closeout(s) hidden).
                    </p>
                    <p className="mt-2 text-taq-nav">
                      For full history: Settings → Shop → Photo review & notifications → choose All → Save.
                    </p>
                  </>
                )}
              </div>
            )}
            {showStorePicker && assignedStores.length > 1 && (
              <div className="mb-4 flex flex-wrap gap-2">
                {assignedStores.map((store) => (
                  <button
                    key={store.id}
                    type="button"
                    onClick={() => onSelectStore(store.id)}
                    className={`rounded-full px-3 py-1.5 text-taq-meta font-black ${currentStore.id === store.id ? "bg-[#112A46] text-white" : "bg-white/90 text-[#716753] ring-1 ring-[#E8E1D4]"}`}
                  >
                    {resolveEmployeeStoreName(store, lang)}
                  </button>
                ))}
              </div>
            )}
            <div className="flex flex-col gap-3.5">
              {displayCloseouts.length ? displayCloseouts.map((day, index) => (
                <div key={day.id} ref={(node) => setCardRef(day.id, node)}>
                  {day.isPrevious && index === 1 && (
                    <p className="mb-3 flex items-center gap-2 text-center text-xs font-extrabold text-[#82745A]">
                      <span className="h-px flex-1 bg-[rgba(141,116,69,0.32)]" />
                      {lang === "ar" ? "الأيام السابقة" : "Previous days"}
                      <span className="h-px flex-1 bg-[rgba(141,116,69,0.32)]" />
                    </p>
                  )}
                  <DailyCloseoutCard
                    lang={lang}
                    closeout={day}
                    expanded={day.uiExpanded}
                    daySequence={day.dailySequence ?? null}
                    sameDayCloseoutCount={sameDayCloseoutCountByDate.get(day.date) || 1}
                    formatDate={(date) => formatCalendarDate(date, lang)}
                    onToggle={() => toggleExpandedCard(day.id)}
                    onShare={() => {
                      setShareNewlySubmitted(false);
                      setShareTarget(day);
                    }}
                  />
                </div>
              )) : (
                <div className="rounded-3xl bg-[rgba(255,252,244,0.94)] p-8 text-center text-xs font-bold leading-5 text-[#827762] ring-1 ring-[#E8E1D4] backdrop-blur-sm">
                  {hasOlderHiddenCloseouts ? (
                    lang === "ar"
                      ? `لا توجد تقفيلات ضمن نطاق «${historyScopeLabel}». اطلب من المالك تغيير الإعداد إلى «شهر» أو «الكل».`
                      : `No closeouts in the «${historyScopeLabel}» window. Ask the owner to switch to Month or All.`
                  ) : (
                    lang === "ar" ? "لا توجد تقفيلات بعد. اضغط + لفتح يوم جديد." : "No closeouts yet. Tap + to open a new day."
                  )}
                </div>
              )}
            </div>
          </motion.section>
        )}
      </NotebookScrollSurface>
      <CloseoutShareModal
        lang={lang}
        open={Boolean(shareTarget)}
        closeout={shareTarget}
        storeName={resolveCloseoutStoreName({ preferredStoreName: shareTarget?.storeName, closeout: shareTarget, currentStore, lang }) || storeLabel}
        employeeName={lang === "ar" ? employee.nameAr : employee.nameEn}
        notebookTheme={notebookTheme}
        formatCalendarDate={formatCalendarDate}
        newlySubmitted={shareNewlySubmitted}
        onClose={() => {
          setShareTarget(null);
          setShareNewlySubmitted(false);
        }}
      />
    </>
  );
}
