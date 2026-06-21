import type { DisplayLang } from "@/core/i18n/display-locale";
import type {
  OperationalEntry,
  OperationalEntryActor,
  OperationalEntryPayload,
} from "@/features/entries/client/entries-client-types";

export type AnalyticsEntry = OperationalEntry;

export type AnalyticsBusinessRef = {
  id?: string;
  day?: Record<string, unknown>;
  month?: Record<string, unknown>;
  [key: string]: unknown;
};

export type AnalyticsTotals = {
  sales: number;
  expense: number;
  net: number;
  ratio: string;
  proofs: number;
};

export type AnalyticsDaySummaryRow = AnalyticsTotals & {
  id: string;
  dayAr: string;
  dayEn: string;
  fullAr: string;
  fullEn: string;
};

export type AnalyticsSalesChannelRow = {
  channelId?: string;
  name?: string;
  amount: number;
  id?: string;
};

export type DuplicateSalesGroup = {
  businessId?: string;
  date?: string;
  entries?: AnalyticsEntry[];
};

export type ResolveOwnerPeriodSummaryPreferenceInput = {
  localTotals: AnalyticsTotals | null | undefined;
  apiTotals: AnalyticsTotals | null | undefined;
  entriesLoading?: boolean;
  entriesDbSource?: boolean;
};

export type BuildBusinessesWithEntrySummariesInput = {
  businesses?: AnalyticsBusinessRef[];
  operationalEntries?: AnalyticsEntry[];
  monthly?: boolean;
  selectedDate?: string;
  selectedMonth?: string;
};

export type FormatDayLabelFn = (date: string, lang: DisplayLang | string) => string;

export type ResolveChannelNameFn = (row: { name?: string; channelId?: string }) => string;

export type OperationalEntryMutationActor = OperationalEntryActor;

export type PendingDuplicateSummaryState = {
  payload: OperationalEntryPayload;
  previousEntries: OperationalEntry[];
  actor?: "owner" | "employee" | string;
};

export type PersistOperationalEntryThroughApiInput = {
  createOperationalEntryInApi: (args: {
    payload: OperationalEntryPayload;
    actorUserId: string;
    actorRole: "owner" | "employee" | string;
  }) => Promise<OperationalEntry | null>;
  loadOperationalEntriesFromApi: () => Promise<OperationalEntry[]>;
  payload: OperationalEntryPayload;
  actorUserId: string;
  actorRole: "owner" | "employee" | string;
  lang?: DisplayLang;
  entriesApiDbSource?: boolean;
};

export type PersistOperationalEntryThroughApiResult =
  | { ok: true; created: OperationalEntry; refreshed: OperationalEntry[]; refreshFailed: boolean }
  | { ok: false; failureMessage: string; refreshFailed?: boolean };

export type PersistOperationalEntryLocallyInput = {
  payload: OperationalEntryPayload;
  actor: OperationalEntryActor;
  buildEntry: (payload: OperationalEntryPayload, actor: OperationalEntryActor) => OperationalEntry;
  storeAttachmentPayload: (attachment: Record<string, unknown>) => Promise<void>;
};

export type PersistOperationalEntryLocallyResult =
  | { ok: true; entry: OperationalEntry }
  | { ok: false; attachmentFailed?: boolean };

export type CloseoutAlertRecord = {
  id: string;
  businessId?: string;
  date?: string;
  entryId?: string;
  employeeNameAr?: string;
  employeeNameEn?: string;
  seen?: boolean;
  at?: number;
};

export type EmployeeEntryActorInput = {
  id?: string;
  nameAr?: string;
  nameEn?: string;
};

export type CanPersistOperationalEntryInput = {
  saving: boolean;
  payload: OperationalEntryPayload | null | undefined;
  allowedBusinessIds: string[];
};

export type ResolveSuggestedEntryDateInput = {
  lastCloseoutDate?: string | null;
  todayDate: string;
  nextDay: (date: string) => string;
};

export type ResolveSummaryLastCloseoutUpdateResult = {
  businessId: string;
  date: string;
  createdEntry: OperationalEntry | null;
};

export type ResolveOwnerSingleStoreTotalsOptions = {
  entriesDbSource?: boolean;
};
