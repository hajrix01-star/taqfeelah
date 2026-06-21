import type { Dispatch, SetStateAction } from "react";
import type { DisplayLang } from "@/core/i18n/display-locale";

export type OperationalEntryActor = {
  id?: string;
  role?: string;
  userId?: string;
  nameAr?: string;
  nameEn?: string;
};

export type OperationalEntrySalesChannelRow = {
  channelId?: string;
  amount?: number | string;
  name?: string;
  channelName?: string;
  channelLabel?: string;
  id?: string;
};

export type OperationalEntryAttachment = Record<string, unknown> & {
  id?: string;
  kind?: string;
  name?: string;
  mimeType?: string;
  sizeBytes?: number;
  dataUrl?: string | null;
  storageKey?: string;
  originalFileName?: string;
};

export type OperationalEntry = {
  id?: string;
  businessId?: string;
  date?: string;
  createdAt?: string;
  type?: string;
  categoryId?: string | null;
  amount?: number;
  salesChannels?: OperationalEntrySalesChannelRow[];
  note?: string;
  noteKey?: string | null;
  closeoutId?: string | null;
  daySequence?: number | null;
  outflowId?: string | null;
  enteredBy?: OperationalEntryActor;
  attachment?: OperationalEntryAttachment | null;
  attachments?: OperationalEntryAttachment[];
  reviewed?: boolean;
  status?: string;
  voidedAt?: string | null;
  voidedBy?: OperationalEntryActor | null;
  voidReason?: string;
  restoredAt?: string | null;
  restoredBy?: OperationalEntryActor | null;
  restoreReason?: string;
  auditTrail?: Array<Record<string, unknown>>;
  closeoutOwnerEditedAt?: string;
};

export type OperationalEntryPayload = {
  businessId?: string;
  date?: string;
  type?: string;
  categoryId?: string | null;
  amount?: number | string;
  salesChannels?: OperationalEntrySalesChannelRow[];
  note?: string;
  noteKey?: string | null;
  closeoutId?: string | null;
  daySequence?: number | null;
  outflowId?: string | null;
  attachment?: OperationalEntryAttachment | null;
  closeoutDbId?: string;
};

export type OperationalEntryCloseoutRef = {
  closeoutId?: string | null;
  type?: string;
  businessId?: string;
  id?: string;
};

export type RegisterLogFilters = {
  status: string;
  type: string;
  expenseCategory: string;
  attachmentOnly: boolean;
  actor: string;
  salesChannel: string;
};

export type RegisterCloseoutGroup = {
  entries: OperationalEntry[];
  businessId?: string;
  closeoutId?: string | null;
  date?: string;
  key?: string;
};

export type RegisterChannelOption = {
  id: string;
  label: string;
};

export type RegisterReportRow = {
  id?: string;
  date: string;
  sales: number;
  expense: number;
  net: number;
  store?: string;
};

export type HomeAttachmentItem = {
  id: string;
  entryId?: string;
  title?: string;
  titleEn?: string;
  amount?: number;
  reviewed?: boolean;
  businessId?: string;
  attachment?: OperationalEntryAttachment;
  entry?: OperationalEntry;
};

export type HomeAttachmentGroup = {
  dayId?: string;
  date?: string;
  items?: HomeAttachmentItem[];
} | null;

export type RegisterEntriesPageState = {
  entries: OperationalEntry[];
  cursors: Record<string, string>;
  hasMore: boolean;
};

export type EntriesApiActorParams = {
  organizationId: string;
  actorUserId: string;
  actorRole: string;
};

export type EntriesApiAuthParams = EntriesApiActorParams & {
  storeId: string;
};

export type FetchStoreEntriesParams = EntriesApiAuthParams & {
  dateFrom?: string;
  dateTo?: string;
  status?: string;
  limit?: number;
};

export type FetchStoreEntriesPageParams = FetchStoreEntriesParams & {
  cursor?: string;
};

export type CreateStoreEntryApiPayload = OperationalEntryPayload;

export type CreateStoreEntryApiBody = {
  date?: string;
  type?: string;
  categoryId?: string | null;
  note?: string;
  salesChannels?: Array<{
    salesChannelId: string;
    channelName?: string;
    amountHalalas: number;
  }>;
  amountHalalas?: number;
  closeoutId?: string;
  attachment?: Record<string, unknown>;
};

export type RuntimeApiIdMapOverrides = {
  storeIdMap?: Record<string, string>;
  salesChannelIdMap?: Record<string, string>;
};

export type AttachmentRef = {
  id: string;
  kind: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  dataUrl: string | null;
};

export type RegisterOutflowAttachmentItem = {
  id: string;
  entryId: string;
  attachment: AttachmentRef;
  entry: OperationalEntry;
  date: string;
  businessId?: string;
  amount: number;
  label: string;
  labelEn: string;
  voided: boolean;
};

export type RegisterAttachmentGalleryOptions = {
  resolveLabel?: (entry: OperationalEntry, lang: DisplayLang) => string;
  resolveExpenseCategory?: (entry: OperationalEntry) => string;
  configuredChannels?: Array<Record<string, unknown>>;
  todayIso?: string;
  lang?: DisplayLang;
};

export type NoteLabelResolver = (entry: OperationalEntry, lang: DisplayLang | string) => string;

export type EntryAttachmentShareCaptionParams = {
  lang?: DisplayLang | string;
  storeName?: string;
  operationLabel?: string;
  entryDate?: string;
  entryTime?: string;
  daySequence?: number | null;
  sameDayCloseoutCount?: number;
};

export type BuildOperationalEntryOptions = {
  createId?: () => string;
  createdAt?: string;
  parseAmount?: (value: string | number) => number;
};

export type FetchRegisterEntriesPageBundleParams = {
  organizationId: string;
  actorUserId: string;
  actorRole: string;
  storeIdList: string[];
  dateFrom: string;
  dateTo: string;
  pageSize: number;
  cursors?: Map<string, string>;
  replace?: boolean;
  currentEntries?: OperationalEntry[];
};

export type SetState<T> = Dispatch<SetStateAction<T>>;
