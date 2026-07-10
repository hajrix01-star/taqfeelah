"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, Flame, Save, TrendingUp } from "lucide-react";
import { defaultStoreOperationalSettings } from "@/domain/store-operational-settings/normalize";
import { updateStoreOperationalSettingsViaApi } from "@/features/org-config/client/org-config-api-client";
import { useStoreReports } from "@/features/reports/client/use-store-reports";
import { businessName, money, text } from "./taqfeelah-app-catalog-data";
import { NotebookHeading, NotebookRow, StoreScopeTabs, todayIsoDate } from "./taqfeelah-app-notebook";
import type { AppBusiness, AppLang, AppSetState, AppStoreOperationalSettings } from "./taqfeelah-app-types";

type OwnerTargetHeatmapScreenProps = {
  lang: AppLang;
  businessesList: AppBusiness[];
  selectedBusiness: string;
  setSelectedBusiness: (value: string) => void;
  storeOperationalSettings: AppStoreOperationalSettings;
  setStoreOperationalSettings: AppSetState<AppStoreOperationalSettings>;
  reportsApiEnabled: boolean;
  reportsApiOrganizationId?: string | null;
  reportsApiActorUserId?: string | null;
  reportsApiActorRole?: string;
};

type CalendarDay = {
  date: string;
  day: number;
  inMonth: boolean;
};

const WEEKDAY_LABELS = {
  ar: ["\u062d", "\u0646", "\u062b", "\u0631", "\u062e", "\u062c", "\u0633"],
  en: ["S", "M", "T", "W", "T", "F", "S"],
};

function monthDays(month: string): CalendarDay[] {
  const [yearRaw, monthRaw] = month.split("-");
  const year = Number(yearRaw);
  const monthIndex = Number(monthRaw) - 1;
  const first = new Date(year, monthIndex, 1);
  const last = new Date(year, monthIndex + 1, 0);
  const days: CalendarDay[] = [];
  for (let offset = 0; offset < first.getDay(); offset += 1) {
    days.push({ date: "", day: 0, inMonth: false });
  }
  for (let day = 1; day <= last.getDate(); day += 1) {
    const date = `${yearRaw}-${monthRaw}-${String(day).padStart(2, "0")}`;
    days.push({ date, day, inMonth: true });
  }
  while (days.length % 7 !== 0) {
    days.push({ date: "", day: 0, inMonth: false });
  }
  return days;
}

function targetTone(sales: number | null, target: number | null) {
  if (sales === null) return "bg-[#F0ECE2] text-[#827762] ring-[#E1D8C8]";
  if (!target || target <= 0) return "bg-white text-[#112A46] ring-[#E1D8C8]";
  const ratio = sales / target;
  if (ratio >= 1) return "bg-[#DFF3E4] text-[#1F6F3C] ring-[#9ED6AC]";
  if (ratio >= 0.75) return "bg-[#FFF3BF] text-[#7A5A00] ring-[#E8C95A]";
  if (ratio >= 0.5) return "bg-[#FFE0C2] text-[#9A4E12] ring-[#F0B172]";
  return "bg-[#FFE1DE] text-[#A43737] ring-[#E7A3A0]";
}

function parseTarget(value: string): number | null {
  const normalized = value.replace(/[^\d.]/g, "");
  if (!normalized) return null;
  const amount = Number(normalized);
  return Number.isFinite(amount) && amount >= 0 ? amount : null;
}

export function OwnerTargetHeatmapScreen({
  lang,
  businessesList,
  selectedBusiness,
  setSelectedBusiness,
  storeOperationalSettings,
  setStoreOperationalSettings,
  reportsApiEnabled,
  reportsApiOrganizationId = "",
  reportsApiActorUserId = "",
  reportsApiActorRole = "owner",
}: OwnerTargetHeatmapScreenProps) {
  const activeStores = businessesList.filter((business) => !Boolean(business.archived));
  const initialStore = selectedBusiness !== "all" ? selectedBusiness : activeStores[0]?.id || "";
  const [storeId, setStoreId] = useState(initialStore);
  const [selectedMonth, setSelectedMonth] = useState(() => todayIsoDate().slice(0, 7));
  const [targetSaving, setTargetSaving] = useState(false);
  const [targetNotice, setTargetNotice] = useState<"saved" | "failed" | "backend-required" | null>(null);
  const currentSettings = storeOperationalSettings[storeId] || defaultStoreOperationalSettings();
  const target = typeof currentSettings.dailySalesTarget === "number" ? currentSettings.dailySalesTarget : null;
  const [targetDraft, setTargetDraft] = useState(() => (target ? String(target) : ""));
  const selectedStore = activeStores.find((store) => store.id === storeId) || activeStores[0] || null;
  const apiReady = Boolean(reportsApiEnabled && reportsApiOrganizationId && reportsApiActorUserId && storeId);
  const targetBackendReady = Boolean(reportsApiOrganizationId && reportsApiActorUserId && storeId);

  const report = useStoreReports({
    enabled: apiReady,
    organizationId: reportsApiOrganizationId || "",
    actorUserId: reportsApiActorUserId || "",
    actorRole: reportsApiActorRole,
    businesses: activeStores,
    selectedStoreId: storeId,
    period: "month",
    selectedMonth,
    includeDetails: true,
  });

  const salesByDate = useMemo(() => {
    const map = new Map<string, number>();
    report.daysRows.forEach((row) => {
      if (row.id) map.set(row.id, Number(row.sales || 0));
    });
    return map;
  }, [report.daysRows]);

  const visibleDays = useMemo(() => monthDays(selectedMonth), [selectedMonth]);
  const salesValues = [...salesByDate.values()];
  const achievedDays = target && target > 0 ? salesValues.filter((sales) => sales >= target).length : 0;
  const averageSales = salesValues.length ? salesValues.reduce((sum, sales) => sum + sales, 0) / salesValues.length : 0;
  const bestDay = report.daysRows.reduce(
    (best, row) => (Number(row.sales || 0) > best.sales ? { date: row.id, sales: Number(row.sales || 0) } : best),
    { date: "", sales: 0 },
  );
  const showServerUnavailable = !apiReady || Boolean(report.error);
  const showLoading = apiReady && report.loading;
  const targetMissing = !target || target <= 0;

  useEffect(() => {
    setTargetDraft(target ? String(target) : "");
  }, [storeId, target]);

  const saveTarget = async () => {
    if (!targetBackendReady || targetSaving) {
      setTargetNotice("backend-required");
      return;
    }
    const nextTarget = parseTarget(targetDraft);
    setTargetSaving(true);
    setTargetNotice(null);
    try {
      const savedSettings = await updateStoreOperationalSettingsViaApi({
        organizationId: reportsApiOrganizationId || "",
        actorUserId: reportsApiActorUserId || "",
        actorRole: reportsApiActorRole,
        storeId,
        patch: { dailySalesTarget: nextTarget },
        reason: "target_heatmap_daily_sales_target_saved",
      });
      setStoreOperationalSettings((current) => ({
        ...current,
        [storeId]: {
          ...(current[storeId] || defaultStoreOperationalSettings()),
          ...savedSettings,
        },
      }));
      setTargetNotice("saved");
    } catch {
      setTargetNotice("failed");
    } finally {
      setTargetSaving(false);
    }
  };

  const handleStoreChange = (nextStoreId: string) => {
    const safeStoreId = nextStoreId === "all" ? activeStores[0]?.id || "" : nextStoreId;
    setStoreId(safeStoreId);
    setSelectedBusiness(safeStoreId);
    const nextSettings = storeOperationalSettings[safeStoreId] || defaultStoreOperationalSettings();
    setTargetDraft(typeof nextSettings.dailySalesTarget === "number" ? String(nextSettings.dailySalesTarget) : "");
  };

  return (
    <section className="taq-owner-page taq-notebook-body pb-6 pt-1">
      <NotebookHeading
        lang={lang}
        label={text(lang, "targetHeatmapTitle")}
        dateSelector={(
          <input
            type="month"
            value={selectedMonth}
            onChange={(event) => setSelectedMonth(event.target.value || todayIsoDate().slice(0, 7))}
            className="h-9 rounded-xl bg-white px-3 text-taq-meta font-black text-[#112A46] ring-1 ring-black/[0.06]"
          />
        )}
      />
      <StoreScopeTabs
        lang={lang}
        businessesList={activeStores}
        selectedBusiness={storeId}
        setSelectedBusiness={handleStoreChange}
      />

      <NotebookRow lines={3}>
        <div className="grid w-full gap-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-taq-meta font-black text-[#112A46]">{businessName(selectedStore, lang)}</p>
              <p className="mt-1 text-taq-nav font-bold leading-relaxed text-[#827762]">{text(lang, "targetHeatmapHint")}</p>
            </div>
            <Flame className="h-5 w-5 shrink-0 text-[#C28A30]" />
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <label className="w-[132px] max-w-[48vw]">
              <span className="mb-1 block text-taq-nav font-black text-[#806528]">{text(lang, "dailyTarget")}</span>
              <input
                inputMode="decimal"
                value={targetDraft}
                onChange={(event) => setTargetDraft(event.target.value)}
                placeholder="5000"
                className="h-10 w-full rounded-xl bg-white px-3 text-center text-sm font-black tabular-nums text-[#112A46] ring-1 ring-black/[0.06]"
              />
            </label>
            <button
              type="button"
              onClick={saveTarget}
              disabled={!storeId || targetSaving || !targetBackendReady}
              className="flex h-10 items-center justify-center gap-1.5 rounded-xl bg-[#112A46] px-3 text-taq-meta font-black text-white disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {targetSaving ? text(lang, "loading") : text(lang, "saveTarget")}
            </button>
          </div>
          {targetNotice ? (
            <p className={`rounded-xl px-3 py-2 text-center text-taq-meta font-black ${
              targetNotice === "saved" ? "bg-[#EAF7EE] text-[#257844]" : "bg-[#FFF1EE] text-[#B44747]"
            }`}>
              {text(lang, targetNotice === "saved"
                ? "targetSaved"
                : targetNotice === "backend-required"
                  ? "targetBackendRequired"
                  : "targetSaveFailed")}
            </p>
          ) : null}
        </div>
      </NotebookRow>

      <NotebookRow lines={4}>
        <div className="grid w-full grid-cols-3 gap-2">
          <div className="rounded-xl bg-white p-3 ring-1 ring-black/[0.05]">
            <CheckCircle2 className="mb-2 h-4 w-4 text-[#257844]" />
            <p className="text-taq-nav font-bold text-[#827762]">{text(lang, "targetAchievedDays")}</p>
            <p className="mt-1 text-lg font-black tabular-nums text-[#112A46]">{achievedDays}</p>
          </div>
          <div className="rounded-xl bg-white p-3 ring-1 ring-black/[0.05]">
            <TrendingUp className="mb-2 h-4 w-4 text-[#C28A30]" />
            <p className="text-taq-nav font-bold text-[#827762]">{text(lang, "targetAverageSales")}</p>
            <p className="mt-1 text-sm font-black tabular-nums text-[#112A46]">{money(averageSales, lang)}</p>
          </div>
          <div className="rounded-xl bg-white p-3 ring-1 ring-black/[0.05]">
            <CalendarDays className="mb-2 h-4 w-4 text-[#112A46]" />
            <p className="text-taq-nav font-bold text-[#827762]">{text(lang, "targetBestDay")}</p>
            <p className="mt-1 text-sm font-black tabular-nums text-[#112A46]">{bestDay.date ? money(bestDay.sales, lang) : "-"}</p>
          </div>
        </div>
      </NotebookRow>

      <NotebookRow lines={10}>
        <div className="w-full">
          {showLoading ? (
            <p className="rounded-xl bg-white px-3 py-3 text-center text-taq-meta font-black text-[#827762]">
              {text(lang, "loading")}
            </p>
          ) : null}
          {!showServerUnavailable && !showLoading && targetMissing ? (
            <p className="mt-3 rounded-xl bg-[#FFF8E4] px-3 py-2 text-center text-taq-meta font-black text-[#806528]">
              {text(lang, "targetNotSet")}
            </p>
          ) : null}
          <div className="mt-3 grid grid-cols-7 gap-1.5">
            {WEEKDAY_LABELS[lang].map((day, index) => (
              <div key={`${day}-${index}`} className="text-center text-[10px] font-black text-[#827762]">
                {day}
              </div>
            ))}
            {visibleDays.map((day, index) => {
              const sales = !showServerUnavailable && day.date && salesByDate.has(day.date)
                ? salesByDate.get(day.date)!
                : null;
              return (
                <div
                  key={`${day.date || "empty"}-${index}`}
                  className={`aspect-square rounded-xl p-1.5 ring-1 ${day.inMonth ? targetTone(sales, target) : "bg-transparent text-transparent ring-transparent"}`}
                  title={sales === null ? text(lang, "targetNoData") : `${day.date}: ${money(sales, lang)}`}
                >
                  {day.inMonth ? (
                    <div className="flex h-full flex-col justify-between">
                      <span className="text-[10px] font-black leading-none">{day.day}</span>
                      <span className="truncate text-[10px] font-black tabular-nums leading-none">
                        {sales === null ? "-" : money(sales, lang).replace(/\s/g, "")}
                      </span>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </NotebookRow>

      <NotebookRow lines={1}>
        <div className="flex w-full flex-wrap gap-1.5 text-[10px] font-black">
          {[
            ["bg-[#F0ECE2]", text(lang, "targetLegendNoData")],
            ["bg-[#FFE1DE]", text(lang, "targetLegendLow")],
            ["bg-[#FFE0C2]", text(lang, "targetLegendMedium")],
            ["bg-[#FFF3BF]", text(lang, "targetLegendNear")],
            ["bg-[#DFF3E4]", text(lang, "targetLegendMet")],
          ].map(([className, label]) => (
            <span key={label} className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 ring-1 ring-black/[0.04]">
              <span className={`h-2.5 w-2.5 rounded-sm ${className}`} />
              {label}
            </span>
          ))}
        </div>
      </NotebookRow>
    </section>
  );
}
