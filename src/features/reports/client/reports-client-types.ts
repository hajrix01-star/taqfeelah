import type { DisplayLang } from "@/core/i18n/display-locale";
import type { JsonStringMap } from "@/core/client/client-types";
import type { OperationalEntry } from "@/features/entries/client/entries-client-types";

export type ReportsLang = DisplayLang;

export type ReportsAuthContext = {
  organizationId: string;
  actorUserId: string;
  actorRole: string;
};

export type ReportsDateRange = {
  from: string;
  to: string;
};

export type MoneyHalalasField = {
  amountHalalas?: number;
};

export type ApiPeriodSummary = {
  date?: string;
  month?: string;
  totalSales?: MoneyHalalasField;
  totalOutflow?: MoneyHalalasField;
  netMovement?: MoneyHalalasField;
  outflowRatio?: string;
  outflowRatioStatus?: string;
  attachmentCount?: number;
};

export type ApiDayReportRow = ApiPeriodSummary & {
  date: string;
};

export type ApiChannelReportRow = {
  salesChannelId?: string;
  channelName?: string;
  amount?: MoneyHalalasField;
};

export type ApiOutflowCategoryRow = {
  categoryKey?: string;
  amountHalalas?: number;
};

export type ApiOutflowTransactionRow = {
  id?: string;
  date?: string;
  type?: string;
  categoryKey?: string;
  amountHalalas?: number;
  hasAttachment?: boolean;
};

export type ApiDaysReport = {
  days?: ApiDayReportRow[];
};

export type ApiChannelsReport = {
  channels?: ApiChannelReportRow[];
};

export type ApiOutflowReport = {
  categories?: ApiOutflowCategoryRow[];
  transactions?: ApiOutflowTransactionRow[];
  transactionCount?: number;
  totalOutflow?: MoneyHalalasField;
};

export type ApiAttachmentsReport = {
  attachmentCount?: number;
  entriesWithAttachments?: number;
  items?: unknown[];
};

export type UiTotalsRecord = {
  sales?: number;
  expense?: number;
  net?: number;
  ratio?: string;
  proofs?: number;
};

export type UiDayReportRow = {
  id: string;
  dayAr: string;
  dayEn: string;
  sales: number;
  expense: number;
  net: number;
  ratio: string;
  proofs: number;
};

export type UiChannelReportRow = {
  id?: string;
  amount: number;
  [key: string]: unknown;
};

export type UiOutflowCategoryRow = {
  id?: string;
  amount: number;
};

export type FetchStoreReportsBundleInput = ReportsAuthContext & {
  storeIds: string[];
  dateRange: ReportsDateRange;
  period: string;
  configuredChannels: Array<Record<string, unknown>>;
  outflowCategory: string;
  includeOutflowTransactions: boolean;
  includeDetails?: boolean;
};

export type StoreReportsBundle = {
  totalsByStoreId: Record<string, UiTotalsRecord>;
  daysRows: UiDayReportRow[];
  channelRows: UiChannelReportRow[];
  outflowCategories: UiOutflowCategoryRow[];
  outflowTransactions: OperationalEntry[];
  outflowTransactionCount: number;
  outflowTotal: number;
  attachmentProofs: {
    proofs: number;
    items: unknown[];
  };
};

export type FetchReportArgs = ReportsAuthContext & {
  storeId: string;
  from: string;
  to: string;
  extra?: Record<string, unknown>;
};

export type FetchStoreOutflowReportArgs = FetchReportArgs & {
  categoryKey?: string;
  includeTransactions?: boolean;
};

export type FetchStorePeriodSummaryArgs = FetchReportArgs & {
  period?: string;
};

export type ReportsRuntimeApiMapOverrides = {
  storeIdMap?: JsonStringMap;
  userIdMap?: JsonStringMap;
  salesChannelIdMap?: JsonStringMap;
};

export type ReportPeriod = "day" | "month" | "year" | "custom" | string;

export type FilterOutflowEntriesForPeriodInput = {
  entries?: OperationalEntry[];
  selectedBusiness?: string;
  category?: string;
  period: ReportPeriod;
  selectedDate: string;
  selectedMonth: string;
  selectedYear: string;
  customFrom: string;
  customTo: string;
  businessIds?: string[] | null;
  resolveCategory?: (entry: OperationalEntry) => string;
};

export type UseStoreReportsProps = ReportsAuthContext & {
  enabled?: boolean;
  businesses?: Array<Record<string, unknown> & { id?: string; day?: UiTotalsRecord; month?: UiTotalsRecord }>;
  selectedStoreId?: string;
  period?: ReportPeriod;
  selectedDate?: string;
  selectedMonth?: string;
  selectedYear?: string;
  customFrom?: string;
  customTo?: string;
  configuredChannels?: Array<Record<string, unknown>>;
  outflowCategory?: string;
  includeOutflowTransactions?: boolean;
  includeDetails?: boolean;
};

export type FetchStoreSummaryArgs = ReportsAuthContext & {
  storeId: string;
  date?: string;
  month?: string;
};
