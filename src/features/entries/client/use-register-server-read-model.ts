"use client";

import { useStoreReports } from "@/features/reports/client/use-store-reports";
import { useRegisterEntriesFromApi } from "@/features/entries/client/use-register-entries-from-api";
import { useRegisterCloseoutsFromApi } from "@/features/entries/client/use-register-closeouts-from-api";
import type { OperationalEntry } from "@/features/entries/client/entries-client-types";
import type { DailyCloseoutRecord } from "@/features/daily-closeouts/daily-closeouts-types";
import type { UiDayReportRow, UiTotalsRecord } from "@/features/reports/client/reports-client-types";

type UseRegisterServerReadModelProps = {
  enabled: boolean;
  organizationId: string;
  actorUserId: string;
  actorRole: string;
  storeIds: string[];
  selectedStoreId: string;
  period: string;
  selectedDate: string;
  selectedMonth: string;
  selectedYear: string;
  customFrom: string;
  customTo: string;
  logView: string;
  businesses: Array<Record<string, unknown> & { id?: string }>;
  configuredChannels: Array<Record<string, unknown>>;
  closeoutsEnabled?: boolean;
};

export type RegisterServerReadModel = {
  entries: OperationalEntry[];
  entriesLoading: boolean;
  entriesLoaded: boolean;
  entriesError: string;
  entriesHasMore: boolean;
  entriesLoadingMore: boolean;
  entriesLoadingAll: boolean;
  loadMoreEntries: () => Promise<boolean>;
  loadAllEntries: () => Promise<void>;
  refetchEntries: () => unknown;
  closeouts: DailyCloseoutRecord[];
  closeoutsLoading: boolean;
  closeoutsLoaded: boolean;
  closeoutsError: string;
  refetchCloseouts: () => unknown;
  reportDaysRows: UiDayReportRow[];
  reportSingleStoreTotals: UiTotalsRecord | null;
  reportCombinedTotals: UiTotalsRecord;
  reportLoading: boolean;
  reportLoaded: boolean;
  reportError: string;
};

type RegisterEntriesReadState = {
  entries: OperationalEntry[];
  loading: boolean;
  loaded: boolean;
  error: string;
  hasMore: boolean;
  loadingMore: boolean;
  loadingAll: boolean;
  loadMore: () => Promise<boolean>;
  loadAllRemaining: () => Promise<void>;
  refetch: () => unknown;
};

type RegisterReportReadState = {
  daysRows: UiDayReportRow[];
  singleStoreTotals: UiTotalsRecord | null;
  combinedTotals: UiTotalsRecord;
  loading: boolean;
  loaded: boolean;
  error: string;
};

type RegisterCloseoutsReadState = {
  closeouts: DailyCloseoutRecord[];
  loading: boolean;
  loaded: boolean;
  error: string;
  refetch: () => unknown;
};

export function shouldEnableRegisterReportRead({
  enabled,
}: {
  enabled: boolean;
}): boolean {
  return enabled;
}

export function buildRegisterServerReadModel({
  entries,
  report,
  closeouts,
}: {
  entries: RegisterEntriesReadState;
  report: RegisterReportReadState;
  closeouts: RegisterCloseoutsReadState;
}): RegisterServerReadModel {
  return {
    entries: entries.entries,
    entriesLoading: entries.loading,
    entriesLoaded: entries.loaded,
    entriesError: entries.error,
    entriesHasMore: entries.hasMore,
    entriesLoadingMore: entries.loadingMore,
    entriesLoadingAll: entries.loadingAll,
    loadMoreEntries: entries.loadMore,
    loadAllEntries: entries.loadAllRemaining,
    refetchEntries: entries.refetch,
    closeouts: closeouts.closeouts,
    closeoutsLoading: closeouts.loading,
    closeoutsLoaded: closeouts.loaded,
    closeoutsError: closeouts.error,
    refetchCloseouts: closeouts.refetch,
    reportDaysRows: report.daysRows,
    reportSingleStoreTotals: report.singleStoreTotals,
    reportCombinedTotals: report.combinedTotals,
    reportLoading: report.loading,
    reportLoaded: report.loaded,
    reportError: report.error,
  };
}

export function useRegisterServerReadModel({
  enabled,
  organizationId,
  actorUserId,
  actorRole,
  storeIds,
  selectedStoreId,
  period,
  selectedDate,
  selectedMonth,
  selectedYear,
  customFrom,
  customTo,
  logView,
  businesses,
  configuredChannels,
  closeoutsEnabled = false,
}: UseRegisterServerReadModelProps): RegisterServerReadModel {
  const entries = useRegisterEntriesFromApi({
    enabled,
    organizationId,
    actorUserId,
    actorRole,
    storeIds,
    period,
    selectedDate,
    selectedMonth,
    selectedYear,
    customFrom,
    customTo,
  });

  const reportEnabled = shouldEnableRegisterReportRead({ enabled });
  const report = useStoreReports({
    enabled: reportEnabled,
    organizationId,
    actorUserId,
    actorRole,
    businesses,
    selectedStoreId,
    period,
    selectedDate,
    selectedMonth,
    selectedYear,
    customFrom,
    customTo,
    configuredChannels,
    includeOutflowTransactions: false,
    includeDetails: logView === "report",
  });

  const closeouts = useRegisterCloseoutsFromApi({
    enabled: enabled && closeoutsEnabled,
    organizationId,
    actorUserId,
    actorRole,
    storeIds,
    period,
    selectedDate,
    selectedMonth,
    selectedYear,
    customFrom,
    customTo,
  });

  return buildRegisterServerReadModel({ entries, report, closeouts });
}
