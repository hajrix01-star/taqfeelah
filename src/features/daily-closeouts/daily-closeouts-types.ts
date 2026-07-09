import type { ReactNode } from "react";
import type { DisplayLang } from "@/core/i18n/display-locale";
import type { OperationalEntryAttachment } from "@/features/entries/client/entries-client-types";

export type CloseoutSyncLang = DisplayLang;

export type NotebookThemeId =
  | "yellow"
  | "softYellow"
  | "ivory"
  | "white"
  | "greenTint"
  | "pinkTint"
  | "blueTint";

export type NotebookPatternId = "lined" | "grid";

export type CloseoutStatusValue = "draft" | "submitted" | "reviewed" | "returned";

export type OutflowType = "purchases" | "expense" | "withdrawal";

export type CloseoutSalesChannelRow = {
  channelId?: string;
  id?: string;
  name?: string;
  amount?: number | string;
};

export type CloseoutSalesRecord =
  | Record<string, CloseoutSalesChannelRow | number>
  | CloseoutSalesChannelRow[];

export type CloseoutOutflow = {
  id?: string;
  type?: string;
  categoryId?: string | null;
  category?: string;
  typeLabel?: string;
  note?: string;
  noteKey?: string | null;
  amount?: number | string;
  attachments?: Array<OperationalEntryAttachment | string> | null;
};

export type CloseoutTotals = {
  totalSales?: number;
  totalOutflow?: number;
  netMovement?: number;
  sales?: number;
  expense?: number;
  net?: number;
  ratio?: string;
  outflowRatio?: string;
  totalSalesHalalas?: number;
  totalOutflowHalalas?: number;
  netMovementHalalas?: number;
};

export type DailyCloseoutRecord = {
  id?: string;
  storeId?: string;
  storeName?: string;
  date?: string;
  openedByUserId?: string | null;
  openedByName?: string | null;
  openedAt?: string;
  submittedByUserId?: string | null;
  submittedByName?: string | null;
  submittedAt?: string | null;
  reviewedAt?: string | null;
  reviewedByName?: string | null;
  returnedAt?: string | null;
  returnedByName?: string | null;
  returnReason?: string | null;
  ownerEditedAt?: string | null;
  ownerEditedByUserId?: string | null;
  ownerEditedByName?: string | null;
  status?: CloseoutStatusValue | string;
  notebookTheme?: NotebookThemeId | string;
  sales?: CloseoutSalesRecord;
  outflows?: CloseoutOutflow[];
  attachments?: Array<OperationalEntryAttachment | string>;
  totals?: CloseoutTotals;
  syncedToEntries?: boolean;
  createdAt?: string;
  daySequence?: number | null;
  employeeName?: string;
  store?: StoreRef;
};

export type CloseoutEventType =
  | "opened"
  | "submitted"
  | "approved"
  | "returned"
  | "resubmitted"
  | "ownerEdit";

export type CloseoutEvent = {
  id?: string;
  at?: string;
  type?: CloseoutEventType | string;
  closeoutId?: string;
  storeId?: string;
  storeName?: string;
  date?: string;
  dateLabel?: string;
  actorName?: string;
  employeeName?: string;
  reason?: string;
  message?: string;
};

export type CloseoutWorkflowPhase = "save" | "send";

export type CloseoutWorkflowFailure = {
  ok: false;
  phase: CloseoutWorkflowPhase;
};

export type CloseoutSubmitResult =
  | CloseoutWorkflowFailure
  | DailyCloseoutRecord
  | null
  | undefined;

export type CloseoutShareTotals = {
  sales: number;
  expense: number;
  net: number;
  ratio?: string | null;
};

export type CloseoutShareTotalsInput = {
  sales?: number;
  expense?: number;
  net?: number;
  totalSales?: number;
  totalOutflow?: number;
  netMovement?: number;
  ratio?: string;
  outflowRatio?: string;
  totalSalesHalalas?: number;
  totalOutflowHalalas?: number;
  netMovementHalalas?: number;
};

export type CloseoutShareOperationRow = {
  id: string;
  label: string;
  amount: number;
  isSale: boolean;
  meta?: string;
};

export type StorageWriteResult = { ok: boolean };

export type StoreRef = {
  id: string;
  dbStoreId?: string;
  legacyId?: string;
  nameAr?: string;
  nameEn?: string;
  name?: string;
  displayName?: string;
  nameKey?: string;
  storeName?: string;
  title?: string;
  label?: string;
};

export type EmployeeActorRef = {
  id?: string;
  nameAr?: string;
  nameEn?: string;
};

export type CloseoutOperationalActor = EmployeeActorRef | {
  id?: string;
  role?: string;
  userId?: string;
  nameAr?: string;
  nameEn?: string;
};

export type SalesChannelConfig = {
  id: string;
  displayName?: string;
  nameAr?: string;
  nameEn?: string;
  name?: string;
};

export type DailyCloseoutsProviderProps = {
  children: ReactNode;
  lang?: CloseoutSyncLang;
  ownerName?: string;
  onSyncToOperationalEntries?: (closeout: DailyCloseoutRecord) => void | Promise<void>;
  onSubmitCloseoutToApi?:
    | ((params: {
        action: string;
        closeout: DailyCloseoutRecord;
        employee: EmployeeActorRef;
      }) => Promise<unknown>)
    | null;
  onDeleteCloseoutToApi?:
    | ((params: { closeout: DailyCloseoutRecord }) => void | Promise<void>)
    | null;
  loadCloseoutsFromApi?: (() => Promise<unknown[]>) | null;
  closeoutsAutoLoadQueryKey?: string;
  apiStrictMode?: boolean;
  dbSourceMode?: boolean;
};

export type DailyCloseoutsContextValue = {
  closeouts: DailyCloseoutRecord[];
  events: CloseoutEvent[];
  pendingOwnerCloseoutQueue: () => DailyCloseoutRecord[];
  deleteCloseout: (
    closeoutId: string,
    closeoutMeta?: DailyCloseoutRecord | null,
  ) => Promise<void>;
  upsertCloseout: (nextCloseout: DailyCloseoutRecord) => DailyCloseoutRecord;
  openOrResumeDraft: (params: {
    store: StoreRef;
    date: string;
    employee: EmployeeActorRef;
  }) => DailyCloseoutRecord;
  submitCloseout: (params: {
    closeout: DailyCloseoutRecord;
    employee: EmployeeActorRef;
  }) => Promise<CloseoutSubmitResult>;
  ownerEditCloseout: (params: {
    closeout: DailyCloseoutRecord;
    employee: EmployeeActorRef;
  }) => Promise<CloseoutSubmitResult>;
  findForStoreDate: (storeId: string, date: string) => DailyCloseoutRecord | null;
  findAllForStoreDate: (storeId: string, date: string) => DailyCloseoutRecord[];
  syncError: string;
  reloadCloseoutsFromApi: () => Promise<DailyCloseoutRecord[]>;
  usesCloseoutsApi: boolean;
  closeoutsLoading: boolean;
  closeoutsLoaded: boolean;
  closeoutsHasData: boolean;
};

export type NotebookSharePreviewLabels = {
  sales: string;
  purchasesExpenses: string;
  outflowRatio?: string;
  netMovement: string;
  operations: string;
  myCloseout?: string;
};

export type NotebookSharePreviewRecord = CloseoutShareTotals;

export type NotebookSharePreviewProps = {
  lang?: CloseoutSyncLang;
  theme?: NotebookThemeId | string;
  fluid?: boolean;
  periodLabel: string;
  title: string;
  storeName?: string;
  employeeName?: string;
  captionFooter?: string;
  labels: NotebookSharePreviewLabels;
  record: NotebookSharePreviewRecord;
  operations?: CloseoutShareOperationRow[];
  showOutflowRatio?: boolean;
};

export type NotebookShareCaptureOptions = {
  minExportWidthPx?: number;
  targetPixelRatio?: number;
  maxPixelRatio?: number;
  maxOutputDimensionPx?: number;
};

export type ShareImageResult = {
  ok: boolean;
  method: string;
  copied?: boolean;
};
