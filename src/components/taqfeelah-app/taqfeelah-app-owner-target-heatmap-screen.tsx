"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, Flame, Save, TrendingUp } from "lucide-react";
import { defaultStoreOperationalSettings } from "@/domain/store-operational-settings/normalize";
import { notebookCardBackground, notebookThemes } from "@/features/daily-closeouts/notebook-themes";
import { updateStoreOperationalSettingsViaApi } from "@/features/org-config/client/org-config-api-client";
import { useStoreReports } from "@/features/reports/client/use-store-reports";
import { businessName, money, text } from "./taqfeelah-app-catalog-data";
import { NotebookHeading, NotebookRow, StoreScopeTabs, todayIsoDate } from "./taqfeelah-app-notebook";
import type { CSSProperties } from "react";
import type { AppBusiness, AppLang, AppSetState, AppStoreOperationalSettings, NotebookThemeId } from "./taqfeelah-app-types";

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
  notebookTheme?: NotebookThemeId | string;
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

type HeatmapTone = "empty" | "neutral" | "low" | "medium" | "near" | "met";

type HeatmapPalette = {
  surface: string;
  subtleSurface: string;
  text: string;
  mutedText: string;
  accentText: string;
  tones: Record<HeatmapTone, CSSProperties>;
};

function parseHex(hex: string) {
  const normalized = hex.replace("#", "");
  return [
    Number.parseInt(normalized.slice(0, 2), 16),
    Number.parseInt(normalized.slice(2, 4), 16),
    Number.parseInt(normalized.slice(4, 6), 16),
  ] as const;
}

function blendHex(baseHex: string, targetHex: string, ratio: number): string {
  const [r1, g1, b1] = parseHex(baseHex);
  const [r2, g2, b2] = parseHex(targetHex);
  const mix = (from: number, to: number) => Math.round(from + (to - from) * ratio);
  const channel = (value: number) => value.toString(16).padStart(2, "0");
  return `#${channel(mix(r1, r2))}${channel(mix(g1, g2))}${channel(mix(b1, b2))}`;
}

function heatmapToneStyle(background: string, textColor: string, borderColor: string): CSSProperties {
  return {
    backgroundColor: background,
    borderColor,
    color: textColor,
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.38)",
  };
}

function heatmapPalette(theme: NotebookThemeId | string = "yellow"): HeatmapPalette {
  const paper = (notebookThemes[theme as NotebookThemeId] || notebookThemes.yellow).paper;
  const surface = notebookCardBackground(theme, "card");
  const subtleSurface = notebookCardBackground(theme, "inset");
  const ink = "#112A46";
  const muted = "#716753";
  const accent = "#806528";

  return {
    surface,
    subtleSurface,
    text: ink,
    mutedText: muted,
    accentText: accent,
    tones: {
      empty: heatmapToneStyle(blendHex(paper, "#F0ECE2", 0.72), muted, blendHex(paper, "#D8CCB8", 0.65)),
      neutral: heatmapToneStyle(blendHex(paper, "#FFFFFF", 0.54), ink, blendHex(paper, "#D8CCB8", 0.64)),
      low: heatmapToneStyle(blendHex(paper, "#FFDCD8", 0.74), "#913131", blendHex(paper, "#D98D88", 0.68)),
      medium: heatmapToneStyle(blendHex(paper, "#FFE0C2", 0.74), "#8F4A14", blendHex(paper, "#DF9F62", 0.66)),
      near: heatmapToneStyle(blendHex(paper, "#FFF0A8", 0.72), "#705400", blendHex(paper, "#D6B94C", 0.64)),
      met: heatmapToneStyle(blendHex(paper, "#DFF3E4", 0.76), "#1F6F3C", blendHex(paper, "#8BCB9A", 0.66)),
    },
  };
}

function targetTone(sales: number | null, target: number | null): HeatmapTone {
  if (sales === null) return "empty";
  if (!target || target <= 0) return "neutral";
  const ratio = sales / target;
  if (ratio >= 1) return "met";
  if (ratio >= 0.75) return "near";
  if (ratio >= 0.5) return "medium";
  return "low";
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
  notebookTheme = "yellow",
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
  const palette = useMemo(() => heatmapPalette(notebookTheme), [notebookTheme]);

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
            className="h-9 rounded-xl px-3 text-taq-meta font-black ring-1 ring-black/[0.06]"
            style={{ backgroundColor: palette.surface, color: palette.text }}
          />
        )}
      />
      <StoreScopeTabs
        lang={lang}
        businessesList={activeStores}
        selectedBusiness={storeId}
        setSelectedBusiness={handleStoreChange}
      />

      <NotebookRow lines={1}>
        <div className="grid w-full gap-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-taq-meta font-black" style={{ color: palette.text }}>{businessName(selectedStore, lang)}</p>
            </div>
            <Flame className="h-5 w-5 shrink-0 text-[#C28A30]" />
          </div>
        </div>
      </NotebookRow>

      <div className="px-[5px] py-2">
        <div className="grid w-full grid-cols-3 gap-2">
          <div className="rounded-xl p-2.5 ring-1 ring-black/[0.05]" style={{ backgroundColor: palette.surface }}>
            <CheckCircle2 className="mb-1.5 h-4 w-4 text-[#257844]" />
            <p className="text-taq-nav font-bold leading-4" style={{ color: palette.mutedText }}>{text(lang, "targetAchievedDays")}</p>
            <p className="mt-0.5 text-base font-black tabular-nums" style={{ color: palette.text }}>{achievedDays}</p>
          </div>
          <div className="rounded-xl p-2.5 ring-1 ring-black/[0.05]" style={{ backgroundColor: palette.surface }}>
            <TrendingUp className="mb-1.5 h-4 w-4 text-[#C28A30]" />
            <p className="text-taq-nav font-bold leading-4" style={{ color: palette.mutedText }}>{text(lang, "targetAverageSales")}</p>
            <p className="mt-0.5 text-sm font-black tabular-nums" style={{ color: palette.text }}>{money(averageSales, lang)}</p>
          </div>
          <div className="rounded-xl p-2.5 ring-1 ring-black/[0.05]" style={{ backgroundColor: palette.surface }}>
            <CalendarDays className="mb-1.5 h-4 w-4 text-[#112A46]" />
            <p className="text-taq-nav font-bold leading-4" style={{ color: palette.mutedText }}>{text(lang, "targetBestDay")}</p>
            <p className="mt-0.5 text-sm font-black tabular-nums" style={{ color: palette.text }}>{bestDay.date ? money(bestDay.sales, lang) : "-"}</p>
          </div>
        </div>

        <div className="mt-3 w-full">
          <div className="mb-1.5 flex items-center justify-end gap-2">
            <label className="flex items-center gap-2 rounded-xl px-2 py-1.5 ring-1 ring-black/[0.05]" style={{ backgroundColor: palette.surface }}>
              <span className="text-taq-nav font-black" style={{ color: palette.accentText }}>{text(lang, "dailyTarget")}</span>
              <input
                inputMode="decimal"
                value={targetDraft}
                onChange={(event) => setTargetDraft(event.target.value)}
                placeholder="5000"
                className="h-8 w-20 bg-transparent text-center text-sm font-black tabular-nums outline-none"
                style={{ color: palette.text }}
              />
            </label>
            <button
              type="button"
              onClick={saveTarget}
              disabled={!storeId || targetSaving || !targetBackendReady}
              title={text(lang, "saveTarget")}
              aria-label={text(lang, "saveTarget")}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#112A46] text-white disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
            </button>
          </div>
          {targetNotice ? (
            <p className={`mb-1.5 rounded-xl px-3 py-2 text-center text-taq-meta font-black ${
              targetNotice === "saved" ? "bg-[#EAF7EE] text-[#257844]" : "bg-[#FFF1EE] text-[#B44747]"
            }`}>
              {text(lang, targetNotice === "saved"
                ? "targetSaved"
                : targetNotice === "backend-required"
                  ? "targetBackendRequired"
                  : "targetSaveFailed")}
            </p>
          ) : null}
          {showLoading ? (
            <p className="rounded-xl px-3 py-3 text-center text-taq-meta font-black" style={{ backgroundColor: palette.surface, color: palette.mutedText }}>
              {text(lang, "loading")}
            </p>
          ) : null}
          {!showServerUnavailable && !showLoading && targetMissing ? (
            <p className="mb-1.5 rounded-xl bg-[#FFF8E4] px-3 py-2 text-center text-taq-meta font-black text-[#806528]">
              {text(lang, "targetNotSet")}
            </p>
          ) : null}
          <div className="grid grid-cols-7 gap-1.5">
            {WEEKDAY_LABELS[lang].map((day, index) => (
              <div key={`${day}-${index}`} className="text-center text-[10px] font-black" style={{ color: palette.mutedText }}>
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
                  className={`aspect-square rounded-xl border p-1.5 ${day.inMonth ? "" : "bg-transparent text-transparent border-transparent"}`}
                  style={day.inMonth ? palette.tones[targetTone(sales, target)] : undefined}
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
      </div>

      <NotebookRow lines={1}>
        <div className="flex w-full flex-wrap gap-1.5 text-[10px] font-black">
          {[
            ["empty", text(lang, "targetLegendNoData")],
            ["low", text(lang, "targetLegendLow")],
            ["medium", text(lang, "targetLegendMedium")],
            ["near", text(lang, "targetLegendNear")],
            ["met", text(lang, "targetLegendMet")],
          ].map(([tone, label]) => (
            <span key={label} className="inline-flex items-center gap-1 rounded-full px-2 py-1 ring-1 ring-black/[0.04]" style={{ backgroundColor: palette.surface, color: palette.mutedText }}>
              <span className="h-2.5 w-2.5 rounded-sm border" style={palette.tones[tone as HeatmapTone]} />
              {label}
            </span>
          ))}
        </div>
      </NotebookRow>
    </section>
  );
}
