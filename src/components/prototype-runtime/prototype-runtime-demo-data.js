import { Wallet, CreditCard } from "lucide-react";
import { DEFAULT_NEW_STORE_SALES_CHANNEL_IDS } from "@/core/client/sales-channel-catalog";
import { formatCalendarDate } from "@/features/reports/client/report-period-labels";
import {
  createDefaultStoreChannelConfig,
  resolveStoreChannelConfig as readStoreChannelConfig,
} from "@/features/org-config/client/store-channel-config";
import { resolveSalesChannelLabel } from "@/features/org-config/client/sales-channel-display";
import copy from "./prototype-runtime-copy";

const channelCatalog = {
  cash: { id: "cash", text: "cash", kind: "payment_method", icon: Wallet },
  card: { id: "card", text: "card", kind: "payment_method", icon: CreditCard },
};

const channels = DEFAULT_NEW_STORE_SALES_CHANNEL_IDS.map((id) => channelCatalog[id]);
const DEFAULT_STORE_CHANNEL_CONFIG = createDefaultStoreChannelConfig(channels);
const resolveStoreChannelConfig = (settings, storeId) => (
  readStoreChannelConfig(settings, storeId, DEFAULT_STORE_CHANNEL_CONFIG)
);

const channelName = (channel, lang) => resolveSalesChannelLabel(channel, lang, text);

const expenseCategories = [
  { id: "rent", label: "rent", amount: 8000 },
  { id: "salary", label: "salary", amount: 12000 },
  { id: "utility", label: "utility", amount: 2400 },
  { id: "phone", label: "phone", amount: 650 },
  { id: "maintenance", label: "maintenance", amount: 1200 },
  { id: "other", label: "other", amount: 270 },
];

const outflowReportCategories = [{ id: "all", label: "allCategories" }, { id: "purchases", label: "purchases" }, { id: "withdrawal", label: "withdrawal" }, ...expenseCategories];
const emptyStoreRecord = { sales: 0, expense: 0, ratio: "0.0%", net: 0, proofs: 0 };
const businesses = [
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
const businessName = (business, lang, short = false) => {
  if (!business) return "";
  if (business.displayName) return business.displayName;
  if (short && business.shortKey) return text(lang, business.shortKey);
  if (business.nameKey) return text(lang, business.nameKey);
  return lang === "ar" ? business.nameAr : business.nameEn;
};
const businessLocation = (business, lang) => business?.locationKey ? text(lang, business.locationKey) : (business?.customLocation || "");
const businessRecord = (business, monthly) => (monthly ? business?.month : business?.day) || emptyStoreRecord;
const combinedTotals = (monthly, storeList = businesses) => storeList.reduce((total, business) => {
  const record = businessRecord(business, monthly);
  return { sales: total.sales + record.sales, expense: total.expense + record.expense, net: total.net + record.net, proofs: total.proofs + record.proofs };
}, { sales: 0, expense: 0, net: 0, proofs: 0 });
const text = (lang, key) => copy[lang][key] || key;
const money = (value, lang) => {
  const numericValue = Number(value) || 0;
  const sign = numericValue < 0 ? "-" : "";
  const formatted = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(Math.abs(numericValue));
  return lang === "ar" ? `${sign}${formatted} ر.س` : `${sign}${formatted} SAR`;
};
const fullDate = (day, lang) => lang === "ar" ? day.fullAr : day.fullEn;
const shortDate = (day, lang) => lang === "ar" ? day.dayAr : day.dayEn;
const opDate = (item, lang) => item.date ? formatCalendarDate(item.date, lang) : (lang === "ar" ? item.dateAr : item.dateEn);
const opTime = (item, lang) => item.createdAt ? new Intl.DateTimeFormat(lang === "ar" ? "ar-SA-u-nu-latn" : "en-US", { hour: "numeric", minute: "2-digit" }).format(new Date(item.createdAt)) : (lang === "ar" ? item.timeAr : item.timeEn);
const auditDateTime = (timestamp, lang) => {
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
