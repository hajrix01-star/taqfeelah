"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import NotebookScrollSurface from "../daily-closeouts/NotebookScrollSurface";
import DailyCloseoutCard from "./DailyCloseoutCard";
import DailyCloseoutEntryFlow from "./DailyCloseoutEntryFlow";
import CloseoutShareModal from "./CloseoutShareModal";
import { useDailyCloseouts } from "../daily-closeouts/DailyCloseoutsProvider";
import { createDraftCloseout } from "../daily-closeouts/daily-closeouts-demo-store";
import { CLOSEOUT_STATUS } from "../daily-closeouts/closeout-status";

export default function EmployeeCloseoutsView({
  lang,
  employee,
  currentStore,
  assignedStores,
  onSelectStore,
  salesChannels,
  notebookTheme,
  reviewWorkflowEnabled,
  formatCalendarDate,
  channelLabel,
  settingsPanel,
  onRegisterAdd,
  onRegisterSettingsOpener,
  onEntryActiveChange,
  findForStoreDate: findForStoreDateProp,
  saving,
}) {
  const {
    closeouts,
    upsertCloseout,
    deleteCloseout,
    submitCloseout,
    resubmitCloseout,
    findForStoreDate,
  } = useDailyCloseouts();

  const [entryCloseout, setEntryCloseout] = useState(null);
  const [entryResubmit, setEntryResubmit] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [shareTarget, setShareTarget] = useState(null);
  const [shareNewlySubmitted, setShareNewlySubmitted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const storeCloseouts = useMemo(
    () => closeouts.filter((item) => item.storeId === currentStore?.id && item.openedByUserId === employee.id),
    [closeouts, currentStore?.id, employee.id],
  );

  const displayCloseouts = useMemo(() => {
    if (!storeCloseouts.length) return [];
    const newestId = storeCloseouts[0]?.id;
    return storeCloseouts.map((item, index) => ({
      ...item,
      uiExpanded: expandedId ? expandedId === item.id : index === 0 && item.id === newestId,
      isPrevious: index > 0,
    }));
  }, [storeCloseouts, expandedId]);

  const storeLabel = lang === "ar" ? currentStore?.nameAr : currentStore?.nameEn;

  const openSettings = useCallback(() => setShowSettings(true), []);

  const startNewCloseout = useCallback(() => {
    const today = new Date();
    const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    setEntryResubmit(false);
    setEntryCloseout(
      createDraftCloseout({
        storeId: currentStore.id,
        storeName: storeLabel,
        date: todayIso,
        employee: { id: employee.id, nameAr: employee.nameAr, nameEn: employee.nameEn },
      }),
    );
  }, [currentStore.id, employee, storeLabel]);

  useEffect(() => {
    onRegisterAdd?.(startNewCloseout);
    return () => onRegisterAdd?.(null);
  }, [onRegisterAdd, startNewCloseout]);

  useEffect(() => {
    onRegisterSettingsOpener?.(openSettings);
    return () => onRegisterSettingsOpener?.(null);
  }, [onRegisterSettingsOpener, openSettings]);

  useEffect(() => {
    onEntryActiveChange?.(Boolean(entryCloseout) || showSettings);
    return () => onEntryActiveChange?.(false);
  }, [entryCloseout, showSettings, onEntryActiveChange]);

  const resolveStoreDate = (date) => (findForStoreDateProp || findForStoreDate)(currentStore.id, date);

  const handleSubmit = async (closeout, { isResubmit }) => {
    const fn = isResubmit ? resubmitCloseout : submitCloseout;
    const next = await fn({ closeout, employee, reviewWorkflowEnabled });
    setEntryCloseout(null);
    setEntryResubmit(false);
    setExpandedId(next.id);
    setShareTarget(next);
    setShareNewlySubmitted(true);
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
        onSaveDraft={upsertCloseout}
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
            <h1 className="relative mx-auto mb-6 w-fit pb-3 text-center text-[27px] font-extrabold tracking-tight text-[#112A46] after:absolute after:bottom-0 after:left-1/2 after:h-0.5 after:w-[68px] after:-translate-x-1/2 after:bg-[#D69C2F]">
              {lang === "ar" ? "تقفيلاتي اليومية" : "My daily closeouts"}
            </h1>
            {!channelsReady && (
              <div className="mb-4 rounded-2xl bg-[#FFF1EE]/90 p-3 text-[11px] font-bold text-[#B44747] ring-1 ring-[#B44747]/10 backdrop-blur-sm">
                {lang === "ar" ? "لا توجد قنوات بيع مفعّلة لهذا المحل. اطلب من المالك تفعيلها من الإعدادات." : "No active sales channels for this store. Ask the owner to enable them in settings."}
              </div>
            )}
            {assignedStores.length > 1 && (
              <div className="mb-4 flex flex-wrap gap-2">
                {assignedStores.map((store) => (
                  <button
                    key={store.id}
                    type="button"
                    onClick={() => onSelectStore(store.id)}
                    className={`rounded-full px-3 py-1.5 text-[10px] font-black ${currentStore.id === store.id ? "bg-[#112A46] text-white" : "bg-white/90 text-[#716753] ring-1 ring-[#E8E1D4]"}`}
                  >
                    {lang === "ar" ? store.nameAr : store.nameEn}
                  </button>
                ))}
              </div>
            )}
            <div className="flex flex-col gap-3.5">
              {displayCloseouts.length ? displayCloseouts.map((day, index) => (
                <div key={day.id}>
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
                    reviewWorkflowEnabled={reviewWorkflowEnabled}
                    formatDate={(date) => formatCalendarDate(date, lang)}
                    onToggle={() => setExpandedId((current) => (current === day.id ? null : day.id))}
                    onShare={() => {
                      setShareNewlySubmitted(false);
                      setShareTarget(day);
                    }}
                    onEditResubmit={day.status === CLOSEOUT_STATUS.RETURNED ? () => {
                      setEntryResubmit(true);
                      setEntryCloseout(day);
                    } : undefined}
                  />
                </div>
              )) : (
                <div className="rounded-3xl bg-[rgba(255,252,244,0.94)] p-8 text-center text-xs font-bold text-[#827762] ring-1 ring-[#E8E1D4] backdrop-blur-sm">
                  {lang === "ar" ? "لا توجد تقفيلات بعد. اضغط + لفتح يوم جديد." : "No closeouts yet. Tap + to open a new day."}
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
        storeName={storeLabel}
        reviewWorkflowEnabled={reviewWorkflowEnabled}
        newlySubmitted={shareNewlySubmitted}
        onClose={() => {
          setShareTarget(null);
          setShareNewlySubmitted(false);
        }}
      />
    </>
  );
}
