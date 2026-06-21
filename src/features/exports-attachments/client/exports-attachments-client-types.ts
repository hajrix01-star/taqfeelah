import type { OperationalEntry, OperationalEntryPayload, RuntimeApiIdMapOverrides } from "@/features/entries/client/entries-client-types";
import type { ExportSnapshot } from "@/features/exports/client/exports-client-types";
import type { RuntimeSettingsAuth } from "@/features/runtime-settings/client/runtime-settings-client-types";

export type ExportsAttachmentsAuth = RuntimeSettingsAuth;

export type NotebookExportRequest = {
  storeId: string;
  period: string;
  from: string;
  to: string;
  date?: string;
  month?: string;
};

export type NotebookExportShareRecord = {
  sales: number;
  expense: number;
  net: number;
  ratio: string;
  proofs: number;
};

export type NotebookExportShareData = {
  entries: OperationalEntry[];
  record: NotebookExportShareRecord;
  shareChannelRows: Array<{ id?: string; label: string; amount: number }>;
  shareDayRows: Array<{ date: string; sales: number; expense: number; net: number }>;
  proofs: number;
};

export type UseNotebookExportShareDataProps = {
  enabled?: boolean;
  auth?: ExportsAttachmentsAuth;
  snapshot?: ExportSnapshot | null;
};

export type ApproveDuplicateSummaryViaApiInput = ExportsAttachmentsAuth & {
  storeId: string;
  date: string;
  payload: OperationalEntryPayload;
};

export type AcknowledgeDuplicateSummariesViaApiInput = ExportsAttachmentsAuth & {
  storeId: string;
  date: string;
  entryIds: string[];
};

export type FetchNotebookExportViaApiInput = ExportsAttachmentsAuth & NotebookExportRequest;

export type RegisterInlineAttachmentViaApiInput = ExportsAttachmentsAuth & {
  storeId: string;
  attachment: Record<string, unknown>;
};

export type ResolveInlineAttachmentPayloadForApiInput = {
  enabled?: boolean;
  organizationId?: string;
  actorUserId?: string;
  actorRole?: string;
  storeId?: string;
  payload?: OperationalEntryPayload | null;
};

export type { RuntimeApiIdMapOverrides };
