import type { DisplayLang } from "@/core/i18n/display-locale";
import type { OperationalEntry } from "@/features/entries/client/entries-client-types";

export type ExportColumnType = "text" | "number" | "date";

export type ExportColumn = {
  key: string;
  label: string;
  type: ExportColumnType;
  sum?: boolean;
};

export function exportColumn(
  key: string,
  label: string,
  type: ExportColumnType,
  sum?: boolean,
): ExportColumn {
  if (sum === undefined) return { key, label, type };
  return { key, label, type, sum };
}

export type ExportSheetRow = Record<string, string | number | null>;

export type ExportSheet = {
  name: string;
  columns: ExportColumn[];
  rows: ExportSheetRow[];
};

export type ExportSnapshot = Record<string, unknown> & {
  screen?: string;
  period?: string;
  selectedDate?: string;
  selectedMonth?: string;
  selectedYear?: string;
  customFrom?: string;
  customTo?: string;
  selectedBusiness?: string;
  registerView?: string;
  includedBusinessIds?: string[];
  outflowCategory?: string;
  generalReportGranularity?: string;
};

export type ExportBusiness = Record<string, unknown> & {
  id?: string;
  nameAr?: string;
  nameEn?: string;
};

export type ExportMeta = {
  title: string;
  storeLabel: string;
  storeName: string;
  periodLabel: string;
  exportedAt: string;
  viewLabel?: string;
};

export type ExportApiExtras = {
  apiEntries?: OperationalEntry[] | null;
  apiRecord?: Record<string, unknown> | null;
  apiChannelRows?: Array<Record<string, unknown>> | null;
  apiDayRows?: Array<Record<string, unknown>> | null;
};

export type BuildDataExportModelInput = {
  snapshot: ExportSnapshot;
  lang: DisplayLang;
  businessesList?: ExportBusiness[];
  operationalEntries?: OperationalEntry[];
  archivedBusinessIds?: string[];
  apiEntries?: OperationalEntry[] | null;
  apiRecord?: Record<string, unknown> | null;
  apiChannelRows?: Array<Record<string, unknown>> | null;
  apiDayRows?: Array<Record<string, unknown>> | null;
};

export type ProfessionalExportPayload = {
  meta: ExportMeta;
  sheets: ExportSheet[];
  safeExportName: string;
  lang: DisplayLang;
};

export type DataExportModel = {
  meta: ExportMeta;
  sheets: ExportSheet[];
  safeExportName: string;
  previewTable: {
    headers: string[];
    rows: string[][];
  };
  title: string;
  periodLabel: string;
  combined: boolean;
  shareModel?: Record<string, unknown>;
};
