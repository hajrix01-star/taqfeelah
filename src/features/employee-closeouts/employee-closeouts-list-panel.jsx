"use client";

import { motion } from "framer-motion";
import DailyCloseoutCard from "./DailyCloseoutCard";
import CloseoutsListLoading from "./CloseoutsListLoading";
import { resolveEmployeeStoreName } from "./store-name-resolver";

export function EmployeeCloseoutsListPanel({
  lang,
  pageTitle,
  employeeDisplayName = "",
  employeeRuntimeReady,
  channelsReady,
  syncError,
  hasOlderHiddenCloseouts,
  historyScopeLabel,
  hiddenCloseoutCount,
  showStorePicker,
  assignedStores,
  currentStore,
  onSelectStore,
  closeoutsListPending,
  displayCloseouts,
  sameDayCloseoutCountByDate,
  formatCalendarDate,
  setCardRef,
  toggleExpandedCard,
  setShareTarget,
  setShareNewlySubmitted,
  attachmentsApiEnabled,
  attachmentsApiOrganizationId,
  attachmentsApiActorUserId,
  attachmentsApiActorRole,
}) {
  return (
    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="taq-owner-page taq-notebook-body pb-28 pt-1">
      <h1 className="relative mx-auto mb-2 w-fit pb-3 text-center text-taq-hero font-extrabold tracking-tight text-[#112A46] after:absolute after:bottom-0 after:left-1/2 after:h-0.5 after:w-[68px] after:-translate-x-1/2 after:bg-[#D69C2F]">
        {pageTitle || (lang === "ar" ? "تقفيلاتي اليومية" : "My daily closeouts")}
      </h1>
      {employeeDisplayName ? (
        <p className="mx-auto mb-4 max-w-xs truncate text-center text-sm font-extrabold text-[#716753]">
          {employeeDisplayName}
        </p>
      ) : null}
      {!employeeRuntimeReady && (
        <div className="mb-4 rounded-2xl bg-[#FFF4D2]/95 p-3 text-taq-meta font-bold text-[#806528] ring-1 ring-[#E8E1D4] backdrop-blur-sm">
          {lang === "ar" ? "جاري تحميل إعدادات المحل وطرق الدفع من الخادم…" : "Loading store settings and payment methods from the server…"}
        </div>
      )}
      {employeeRuntimeReady && !channelsReady && (
        <div className="mb-4 rounded-2xl bg-[#FFF1EE]/90 p-3 text-taq-meta font-bold text-[#B44747] ring-1 ring-[#B44747]/10 backdrop-blur-sm">
          {text(lang, "noSalesChannels")}
        </div>
      )}
      {syncError ? (
        <div className="mb-4 rounded-2xl bg-[#FFF1EE]/90 p-3 text-taq-meta font-bold text-[#B44747] ring-1 ring-[#B44747]/10 backdrop-blur-sm">
          {syncError}
        </div>
      ) : null}
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
        {closeoutsListPending ? (
          <CloseoutsListLoading lang={lang} />
        ) : displayCloseouts.length ? displayCloseouts.map((day, index) => (
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
              attachmentsApiEnabled={attachmentsApiEnabled}
              attachmentsApiOrganizationId={attachmentsApiOrganizationId}
              attachmentsApiActorUserId={attachmentsApiActorUserId}
              attachmentsApiActorRole={attachmentsApiActorRole}
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
  );
}
