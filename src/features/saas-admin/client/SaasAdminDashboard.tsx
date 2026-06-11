"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  fetchInvestorDashboard,
  fetchSaasOrganizationAnalytics,
  runSaasAnalyticsAggregate,
} from "@/features/saas-admin/client/saas-admin-api-client";

const SEGMENT_LABELS: Record<string, string> = {
  power: "دائم",
  regular: "منتظم",
  intermittent: "متقطع",
  dormant: "خامل",
  churned: "مغادر",
};

const SEGMENT_HINTS: Record<string, string> = {
  power: "15+ يوم نشط خلال 30 يوم",
  regular: "8–14 يوم نشط",
  intermittent: "1–7 أيام نشطة",
  dormant: "لا نشاط تقفيل/عملية",
  churned: "إلغاء أو خمول طويل",
};

const BILLING_LABELS: Record<string, string> = {
  trial: "تجريبي",
  paid: "مدفوع",
};

type CountPercent = { count: number; percent: number };
type TrendRow = {
  date: string;
  activeOrganizations: number;
  mrr: number;
  collections: number;
  newOrganizations: number;
};

type InvestorDashboard = {
  from: string;
  to: string;
  asOf: string | null;
  subscribers: {
    total: number;
    trial: CountPercent;
    paid: CountPercent;
    activeWithCoreUsageL30: CountPercent;
  };
  engagement: {
    segments: Record<string, CountPercent>;
    habitualUsers: CountPercent & { definition?: string };
    intermittentUsers: CountPercent;
    dormantSubscribers: CountPercent;
  };
  revenue: {
    mrr: number;
    arr: number;
    collectionsInRange: number;
    failedPaymentsInRange: number;
    currency: string;
  };
  platform: {
    activeOrganizationsL30: number;
    newOrganizationsInRange: number;
    churnedSignalsInRange: number;
  };
  trends: TrendRow[];
  methodology: {
    coreActiveEvents: string[];
    subscriberScope: string;
    segmentDaysWindow: number;
  };
};

type OrganizationRow = {
  id: string;
  name: string;
  billingType: string;
  engagementSegment: string;
  activeDaysL30: number;
  closeoutsL30: number;
  entriesL30: number;
  operationalGmvL30: number;
  daysSinceLastCoreActivity: number | null;
  tenureDays: number;
  storesCount: number;
};

function formatDateInput(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function defaultRange() {
  const to = new Date();
  const from = new Date();
  from.setUTCDate(from.getUTCDate() - 29);
  return { from: formatDateInput(from), to: formatDateInput(to) };
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("ar-SA").format(value);
}

function MetricCard({
  title,
  value,
  hint,
  accent,
}: {
  title: string;
  value: string;
  hint?: string;
  accent?: "gold" | "navy";
}) {
  return (
    <article className="rounded-[28px] bg-white p-5 ring-1 ring-black/[0.045]">
      <p className={`text-taq-meta font-black ${accent === "gold" ? "text-[#B99844]" : "text-[#B99844]"}`}>
        {title}
      </p>
      <p className="mt-2 text-2xl font-black text-[#112A46]">{value}</p>
      {hint ? <p className="mt-2 text-xs font-bold leading-6 text-[#716753]">{hint}</p> : null}
    </article>
  );
}

function SubscriberDonut({ trial, paid, total }: { trial: CountPercent; paid: CountPercent; total: number }) {
  const trialPct = trial.percent;
  const paidPct = paid.percent;
  const gradient = total > 0
    ? `conic-gradient(#112A46 0 ${paidPct}%, #B99844 ${paidPct}% ${paidPct + trialPct}%, #E8E2D6 ${paidPct + trialPct}% 100%)`
    : "conic-gradient(#E8E2D6 0 100%)";

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:justify-between">
      <div
        className="relative grid h-40 w-40 shrink-0 place-items-center rounded-full"
        style={{ background: gradient }}
        aria-hidden
      >
        <div className="grid h-28 w-28 place-items-center rounded-full bg-white text-center">
          <span className="text-2xl font-black text-[#112A46]">{formatNumber(total)}</span>
          <span className="text-[10px] font-bold text-[#827762]">مشترك</span>
        </div>
      </div>
      <div className="w-full space-y-4">
        <div className="rounded-2xl bg-[#F8F6F0] p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-[#B99844]" />
              <span className="text-sm font-black">تجريبي</span>
            </div>
            <span className="text-lg font-black text-[#112A46]">
              {formatNumber(trial.count)}
              <span className="mr-1 text-sm font-bold text-[#827762]">({trialPct}%)</span>
            </span>
          </div>
          <p className="mt-1 text-xs font-bold text-[#827762]">اشتراكات `trialing` ضمن نطاق المستثمر</p>
        </div>
        <div className="rounded-2xl bg-[#F8F6F0] p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-[#112A46]" />
              <span className="text-sm font-black">مدفوع</span>
            </div>
            <span className="text-lg font-black text-[#112A46]">
              {formatNumber(paid.count)}
              <span className="mr-1 text-sm font-bold text-[#827762]">({paidPct}%)</span>
            </span>
          </div>
          <p className="mt-1 text-xs font-bold text-[#827762]">اشتراكات `active` و `past_due`</p>
        </div>
      </div>
    </div>
  );
}

function TrendBars({
  title,
  rows,
  valueKey,
  color,
  suffix = "",
}: {
  title: string;
  rows: TrendRow[];
  valueKey: keyof Pick<TrendRow, "mrr" | "activeOrganizations" | "collections" | "newOrganizations">;
  color: string;
  suffix?: string;
}) {
  const values = rows.map((row) => Number(row[valueKey] || 0));
  const max = Math.max(1, ...values);

  return (
    <article className="rounded-[28px] bg-white p-5 ring-1 ring-black/[0.045]">
      <h2 className="text-lg font-black">{title}</h2>
      {rows.length === 0 ? (
        <p className="mt-4 text-sm font-bold text-[#827762]">لا توجد بيانات اتجاه بعد التجميع اليومي.</p>
      ) : (
        <>
          <div className="mt-5 flex h-28 items-end gap-1">
            {rows.map((row) => {
              const value = Number(row[valueKey] || 0);
              const height = Math.max(6, Math.round((value / max) * 100));
              return (
                <div key={row.date} className="group flex min-w-0 flex-1 flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t-md transition-opacity group-hover:opacity-80"
                    style={{ height: `${height}%`, backgroundColor: color }}
                    title={`${row.date}: ${formatNumber(value)}${suffix}`}
                  />
                </div>
              );
            })}
          </div>
          <div className="mt-2 flex justify-between text-[10px] font-bold text-[#827762]">
            <span dir="ltr">{rows[0]?.date}</span>
            <span dir="ltr">{rows.at(-1)?.date}</span>
          </div>
        </>
      )}
    </article>
  );
}

export default function SaasAdminDashboard() {
  const initialRange = useMemo(() => defaultRange(), []);
  const [from, setFrom] = useState(initialRange.from);
  const [to, setTo] = useState(initialRange.to);
  const [billingFilter, setBillingFilter] = useState<"all" | "trial" | "paid">("all");
  const [segmentFilter, setSegmentFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [aggregating, setAggregating] = useState(false);
  const [error, setError] = useState("");
  const [dashboard, setDashboard] = useState<InvestorDashboard | null>(null);
  const [organizations, setOrganizations] = useState<OrganizationRow[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [dashboardPayload, orgPayload] = await Promise.all([
        fetchInvestorDashboard({ from, to }),
        fetchSaasOrganizationAnalytics({
          from,
          to,
          billingType: billingFilter,
          segment: segmentFilter,
          limit: 100,
        }),
      ]);
      setDashboard(dashboardPayload as InvestorDashboard);
      const orgs = (orgPayload as { organizations?: OrganizationRow[] })?.organizations;
      setOrganizations(Array.isArray(orgs) ? orgs : []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "تعذر تحميل لوحة SaaS");
    } finally {
      setLoading(false);
    }
  }, [from, to, billingFilter, segmentFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const runAggregate = async () => {
    setAggregating(true);
    setError("");
    try {
      await runSaasAnalyticsAggregate(to);
      await load();
    } catch (aggregateError) {
      setError(aggregateError instanceof Error ? aggregateError.message : "تعذر تشغيل التجميع");
    } finally {
      setAggregating(false);
    }
  };

  const subscribers = dashboard?.subscribers;
  const engagement = dashboard?.engagement;
  const revenue = dashboard?.revenue;
  const platform = dashboard?.platform;
  const segments = engagement?.segments;
  const trial = subscribers?.trial;
  const paid = subscribers?.paid;
  const habitual = engagement?.habitualUsers;
  const trends = dashboard?.trends ?? [];

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-taq-meta font-black uppercase tracking-wide text-[#B99844]">Investor Analytics</p>
          <h1 className="mt-1 text-2xl font-black text-[#112A46]">لوحة المنصة — تقارير المستثمر</h1>
          <p className="mt-2 text-sm font-bold text-[#716753]">
            النشاط = تقفيلة أو عملية · المشتركون = تجريبي + مدفوع مع نسبة لكل فئة
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-xs font-bold text-[#716753]">
            من
            <input
              type="date"
              value={from}
              onChange={(event) => setFrom(event.target.value)}
              className="mt-1 block rounded-xl border border-[#ECE6DA] px-3 py-2 text-sm font-bold"
            />
          </label>
          <label className="text-xs font-bold text-[#716753]">
            إلى
            <input
              type="date"
              value={to}
              onChange={(event) => setTo(event.target.value)}
              className="mt-1 block rounded-xl border border-[#ECE6DA] px-3 py-2 text-sm font-bold"
            />
          </label>
          <button
            type="button"
            onClick={() => void load()}
            className="rounded-2xl bg-[#112A46] px-4 py-2.5 text-sm font-black text-white"
          >
            تحديث
          </button>
          <button
            type="button"
            disabled={aggregating}
            onClick={() => void runAggregate()}
            className="rounded-2xl bg-white px-4 py-2.5 text-sm font-black text-[#112A46] ring-1 ring-black/[0.05] disabled:opacity-60"
          >
            {aggregating ? "جاري التجميع…" : "تجميع اليوم"}
          </button>
        </div>
      </header>

      {error ? (
        <div className="rounded-2xl bg-[#FCEFEF] px-4 py-3 text-sm font-bold text-[#B44747]">{error}</div>
      ) : null}

      {loading ? (
        <p className="text-sm font-bold text-[#827762]">جاري تحميل المؤشرات…</p>
      ) : (
        <>
          <section className="grid gap-4 xl:grid-cols-[1.1fr_1.9fr]">
            <article className="rounded-[28px] bg-white p-6 ring-1 ring-black/[0.045]">
              <h2 className="text-lg font-black">مزيج المشتركين (تجريبي / مدفوع)</h2>
              <p className="mt-1 text-xs font-bold text-[#827762]">
                النسب محسوبة على إجمالي المشتركين فقط — بدون مجاني أو ملغى
              </p>
              <div className="mt-5">
                <SubscriberDonut
                  trial={trial ?? { count: 0, percent: 0 }}
                  paid={paid ?? { count: 0, percent: 0 }}
                  total={subscribers?.total ?? 0}
                />
              </div>
            </article>

            <section className="grid gap-4 sm:grid-cols-2">
              <MetricCard
                title="MRR"
                value={`${formatNumber(revenue?.mrr ?? 0)} ${revenue?.currency ?? "SAR"}`}
                hint={`ARR ${formatNumber(revenue?.arr ?? 0)} ${revenue?.currency ?? "SAR"}`}
              />
              <MetricCard
                title="مشتركون نشطون (L30)"
                value={formatNumber(subscribers?.activeWithCoreUsageL30?.count ?? 0)}
                hint={`${subscribers?.activeWithCoreUsageL30?.percent ?? 0}% من إجمالي المشتركين`}
              />
              <MetricCard
                title="نسبة الدائمين والمنتظمين"
                value={`${habitual?.percent ?? 0}%`}
                hint={`${formatNumber(habitual?.count ?? 0)} منشأة · 8+ أيام نشطة`}
              />
              <MetricCard
                title="تحصيلات الفترة"
                value={`${formatNumber(revenue?.collectionsInRange ?? 0)} ${revenue?.currency ?? "SAR"}`}
                hint={`فشل دفع: ${formatNumber(revenue?.failedPaymentsInRange ?? 0)}`}
              />
            </section>
          </section>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              title="منشآت نشطة (L30)"
              value={formatNumber(platform?.activeOrganizationsL30 ?? 0)}
              hint="أي نشاط تقفيل أو عملية"
            />
            <MetricCard
              title="منشآت جديدة"
              value={formatNumber(platform?.newOrganizationsInRange ?? 0)}
              hint={`خلال ${from} → ${to}`}
            />
            <MetricCard
              title="إشارات مغادرة"
              value={formatNumber(platform?.churnedSignalsInRange ?? 0)}
              hint="إلغاء أو خمول طويل في الفترة"
            />
            <MetricCard
              title="متقطعون / خاملين"
              value={`${engagement?.intermittentUsers?.percent ?? 0}% / ${engagement?.dormantSubscribers?.percent ?? 0}%`}
              hint={`${formatNumber(engagement?.intermittentUsers?.count ?? 0)} متقطع · ${formatNumber(engagement?.dormantSubscribers?.count ?? 0)} خامل`}
            />
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <TrendBars title="اتجاه MRR" rows={trends} valueKey="mrr" color="#112A46" suffix=" SAR" />
            <TrendBars
              title="اتجاه المنشآت النشطة"
              rows={trends}
              valueKey="activeOrganizations"
              color="#B99844"
            />
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <article className="rounded-[28px] bg-white p-5 ring-1 ring-black/[0.045]">
              <h2 className="text-lg font-black">تفصيل المزيج</h2>
              <div className="mt-4 space-y-3">
                {(["trial", "paid"] as const).map((key) => {
                  const row = subscribers?.[key];
                  return (
                    <div key={key}>
                      <div className="mb-1 flex items-center justify-between text-sm font-bold">
                        <span>{BILLING_LABELS[key]}</span>
                        <span>
                          {formatNumber(row?.count ?? 0)} ({row?.percent ?? 0}%)
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-[#F0ECE2]">
                        <div
                          className={`h-full rounded-full ${key === "trial" ? "bg-[#B99844]" : "bg-[#112A46]"}`}
                          style={{ width: `${Math.min(100, row?.percent ?? 0)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </article>

            <article className="rounded-[28px] bg-white p-5 ring-1 ring-black/[0.045]">
              <h2 className="text-lg font-black">شرائح الاستخدام (L30)</h2>
              <div className="mt-4 space-y-3">
                {Object.entries(SEGMENT_LABELS).map(([key, label]) => {
                  const row = segments?.[key];
                  return (
                    <div key={key}>
                      <div className="mb-1 flex items-center justify-between gap-2 text-sm font-bold">
                        <span>
                          {label}
                          <span className="mr-2 text-[10px] font-bold text-[#827762]">
                            {SEGMENT_HINTS[key]}
                          </span>
                        </span>
                        <span className="shrink-0">
                          {formatNumber(row?.count ?? 0)} ({row?.percent ?? 0}%)
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-[#F0ECE2]">
                        <div
                          className="h-full rounded-full bg-[#B99844]"
                          style={{ width: `${Math.min(100, row?.percent ?? 0)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </article>
          </section>

          <section className="rounded-[28px] bg-white p-5 ring-1 ring-black/[0.045]">
            <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-lg font-black">تفاصيل المنشآت</h2>
                <p className="mt-1 text-xs font-bold text-[#827762]">
                  آخر لقطة: {dashboard?.asOf || "—"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <select
                  value={billingFilter}
                  onChange={(event) => setBillingFilter(event.target.value as "all" | "trial" | "paid")}
                  className="rounded-xl border border-[#ECE6DA] px-3 py-2 text-xs font-bold"
                >
                  <option value="all">كل المشتركين</option>
                  <option value="trial">تجريبي فقط</option>
                  <option value="paid">مدفوع فقط</option>
                </select>
                <select
                  value={segmentFilter}
                  onChange={(event) => setSegmentFilter(event.target.value)}
                  className="rounded-xl border border-[#ECE6DA] px-3 py-2 text-xs font-bold"
                >
                  <option value="all">كل الشرائح</option>
                  {Object.entries(SEGMENT_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-right text-sm">
                <thead>
                  <tr className="border-b border-[#ECE6DA] text-xs font-black text-[#827762]">
                    <th className="px-3 py-2">المنشأة</th>
                    <th className="px-3 py-2">النوع</th>
                    <th className="px-3 py-2">الشريحة</th>
                    <th className="px-3 py-2">أيام نشطة</th>
                    <th className="px-3 py-2">تقفيلات</th>
                    <th className="px-3 py-2">عمليات</th>
                    <th className="px-3 py-2">GMV</th>
                    <th className="px-3 py-2">آخر نشاط</th>
                    <th className="px-3 py-2">مدة الاشتراك</th>
                    <th className="px-3 py-2">محلات</th>
                  </tr>
                </thead>
                <tbody>
                  {organizations.map((org) => (
                    <tr key={org.id} className="border-b border-[#F0ECE2]/80">
                      <td className="px-3 py-3 font-bold">{org.name || "—"}</td>
                      <td className="px-3 py-3">
                        {BILLING_LABELS[org.billingType] || org.billingType}
                      </td>
                      <td className="px-3 py-3">
                        {SEGMENT_LABELS[org.engagementSegment] || org.engagementSegment}
                      </td>
                      <td className="px-3 py-3" dir="ltr">
                        {org.activeDaysL30 ?? 0}/30
                      </td>
                      <td className="px-3 py-3" dir="ltr">{formatNumber(org.closeoutsL30 ?? 0)}</td>
                      <td className="px-3 py-3" dir="ltr">{formatNumber(org.entriesL30 ?? 0)}</td>
                      <td className="px-3 py-3" dir="ltr">
                        {formatNumber(org.operationalGmvL30 ?? 0)}
                      </td>
                      <td className="px-3 py-3">
                        {org.daysSinceLastCoreActivity == null
                          ? "—"
                          : `منذ ${org.daysSinceLastCoreActivity} يوم`}
                      </td>
                      <td className="px-3 py-3">
                        {formatNumber(org.tenureDays ?? 0)} يوم
                      </td>
                      <td className="px-3 py-3" dir="ltr">{formatNumber(org.storesCount ?? 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {organizations.length === 0 ? (
                <p className="py-6 text-center text-sm font-bold text-[#827762]">
                  لا توجد لقطة تحليلية بعد. شغّل «تجميع اليوم» أو سكربت pnpm saas:aggregate.
                </p>
              ) : null}
            </div>
          </section>

          <footer className="rounded-[28px] bg-[#112A46] px-5 py-4 text-xs font-bold leading-6 text-white/85">
            <p className="font-black text-white">منهجية القياس</p>
            <p className="mt-1">
              أحداث النشاط الأساسية: {(dashboard?.methodology?.coreActiveEvents ?? []).join(" · ")}
              {" · "}
              نافذة الشرائح: {dashboard?.methodology?.segmentDaysWindow ?? 30} يوم
              {" · "}
              نطاق المشتركين: {dashboard?.methodology?.subscriberScope ?? "trial + paid"}
            </p>
          </footer>
        </>
      )}
    </div>
  );
}
