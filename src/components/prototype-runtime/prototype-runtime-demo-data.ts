import { Wallet, CreditCard } from "lucide-react";
import { formatDisplayMoneyLabel } from "@/core/money/format-display-money";
import { DEFAULT_NEW_STORE_SALES_CHANNEL_IDS } from "@/core/client/sales-channel-catalog";
import { formatCalendarDate } from "@/features/reports/client/report-period-labels";
import {
  createDefaultStoreChannelConfig,
  resolveStoreChannelConfig as readStoreChannelConfig,
} from "@/features/org-config/client/store-channel-config";
import { resolveSalesChannelLabel } from "@/features/org-config/client/sales-channel-display";
import copy from "./prototype-runtime-copy";
import type {
  PrototypeBusiness,
  PrototypeChannel,
  PrototypeExpenseCategory,
  PrototypeLang,
  PrototypeMoneyFn,
  PrototypeStoreRecord,
  PrototypeTextFn,
} from "./prototype-runtime-types";
import type { StoreChannelConfig } from "@/features/org-config/client/org-config-client-types";

const channelCatalog: Record<string, PrototypeChannel> = {
  cash: { id: "cash", text: "cash", kind: "payment_method", icon: Wallet },
  card: { id: "card", text: "card", kind: "payment_method", icon: CreditCard },
};

const channels: PrototypeChannel[] = DEFAULT_NEW_STORE_SALES_CHANNEL_IDS.map((id) => channelCatalog[id]);
const DEFAULT_STORE_CHANNEL_CONFIG = createDefaultStoreChannelConfig(channels);
const resolveStoreChannelConfig = (
  settings: Record<string, StoreChannelConfig | undefined>,
  storeId: string,
) => (
  readStoreChannelConfig(settings, storeId, DEFAULT_STORE_CHANNEL_CONFIG)
);

const channelName: (channel: PrototypeChannel | Record<string, unknown>, lang: PrototypeLang) => string = (channel, lang) => resolveSalesChannelLabel(channel, lang, text);

const expenseCategories: PrototypeExpenseCategory[] = [
  { id: "rent", label: "rent", amount: 8000 },
  { id: "salary", label: "salary", amount: 12000 },
  { id: "utility", label: "utility", amount: 2400 },
  { id: "phone", label: "phone", amount: 650 },
  { id: "maintenance", label: "maintenance", amount: 1200 },
  { id: "other", label: "other", amount: 270 },
];

const outflowReportCategories: Array<{ id: string; label: string }> = [{ id: "all", label: "allCategories" }, { id: "purchases", label: "purchases" }, { id: "withdrawal", label: "withdrawal" }, ...expenseCategories];
const emptyStoreRecord: PrototypeStoreRecord = { sales: 0, expense: 0, ratio: "0.0%", net: 0, proofs: 0 };
const businesses: PrototypeBusiness[] = [
  {
    id: "shami",
    nameKey: "restaurant",
    shortKey: "shamiShort",
    locationKey: "shamiLocation",
    day: { ...emptyStoreRecord },
    month: { ...emptyStoreRecord },
  },
  {
    id: "arz",
    nameAr: "لاونج ARZ",
    nameEn: "ARZ Lounge",
    shortKey: "arzShort",
    locationKey: "arzLocation",
    day: { ...emptyStoreRecord },
    month: { ...emptyStoreRecord },
  },
];
const businessName = (business: PrototypeBusiness | null | undefined, lang: PrototypeLang, short = false) => {
  if (!business) return "";
  if (business.displayName) return String(business.displayName);
  if (short && business.shortKey) return text(lang, business.shortKey);
  if (business.nameKey) return text(lang, business.nameKey);
  return lang === "ar" ? String(business.nameAr || "") : String(business.nameEn || "");
};
const businessLocation = (business: PrototypeBusiness | null | undefined, lang: PrototypeLang) => business?.locationKey ? text(lang, business.locationKey) : (String(business?.customLocation || ""));
const businessRecord = (business: PrototypeBusiness | null | undefined, monthly: boolean) => (monthly ? business?.month : business?.day) || emptyStoreRecord;
const combinedTotals = (monthly: boolean, storeList: PrototypeBusiness[] = businesses) => storeList.reduce<{ sales: number; expense: number; net: number; proofs: number }>((total, business) => {
  const record = businessRecord(business, monthly);
  return { sales: total.sales + record.sales, expense: total.expense + record.expense, net: total.net + record.net, proofs: total.proofs + record.proofs };
}, { sales: 0, expense: 0, net: 0, proofs: 0 });
const text: PrototypeTextFn = (lang, key) => copy[lang][key as keyof typeof copy.ar] || key;
const money: PrototypeMoneyFn = (value, lang) => formatDisplayMoneyLabel(value, lang);
const fullDate = (day: { fullAr?: string; fullEn?: string }, lang: PrototypeLang) => lang === "ar" ? String(day.fullAr || "") : String(day.fullEn || "");
const shortDate = (day: { dayAr?: string; dayEn?: string }, lang: PrototypeLang) => lang === "ar" ? String(day.dayAr || "") : String(day.dayEn || "");
const opDate = (item: { date?: string; dateAr?: string; dateEn?: string }, lang: PrototypeLang) => item.date ? formatCalendarDate(item.date, lang) : (lang === "ar" ? String(item.dateAr || "") : String(item.dateEn || ""));
const opTime = (item: { createdAt?: string; timeAr?: string; timeEn?: string }, lang: PrototypeLang) => item.createdAt ? new Intl.DateTimeFormat(lang === "ar" ? "ar-SA-u-nu-latn" : "en-US", { hour: "numeric", minute: "2-digit" }).format(new Date(item.createdAt)) : (lang === "ar" ? String(item.timeAr || "") : String(item.timeEn || ""));
const auditDateTime = (timestamp: string, lang: PrototypeLang) => {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "-";
  return `${formatCalendarDate(timestamp.slice(0, 10), lang)} ${opTime({ createdAt: timestamp }, lang)}`;
};

export {
  channels,
  DEFAULT_STORE_CHANNEL_CONFIG,
  resolveStoreChannelConfig,
  channelName,
  expenseCategories,
  outflowReportCategories,
  emptyStoreRecord,
  businesses,
  businessName,
  businessLocation,
  businessRecord,
  combinedTotals,
  text,
  money,
  fullDate,
  shortDate,
  opDate,
  opTime,
  auditDateTime,
};
