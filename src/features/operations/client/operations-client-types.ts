import type { MutableRefObject } from "react";
import type { QueryClient } from "@tanstack/react-query";
import type { OperationalInvalidationScope } from "@/core/client/invalidate-operational-data";
import type { OperationalSyncEventType } from "@/core/sync/operational-sync-event-types";
import type { DisplayLang } from "@/core/i18n/display-locale";
import type {
  OperationalEntry,
  OperationalEntryActor,
  OperationalEntryPayload,
  SetState,
} from "@/features/entries/client/entries-client-types";

export type { OperationalEntry, OperationalEntryActor, OperationalEntryPayload };

export type CloseoutRecord = Record<string, unknown> & {
  id?: string;
  storeId?: string;
  date?: string;
  submittedByUserId?: string;
  openedByUserId?: string;
  submittedByName?: string;
  openedByName?: string;
  syncedToEntries?: boolean;
};

export type RegisterCloseoutSummaryRef = {
  closeoutId?: string | null;
  businessId?: string;
};

export type PendingDuplicateSummary = {
  payload?: OperationalEntryPayload;
  actor?: "owner" | "employee" | string;
} | null;

export type DuplicateSalesAlert = {
  businessId?: string;
  date?: string;
  entries?: OperationalEntry[];
};

export type OwnerOperationOpenAction =
  | { kind: "closeout"; closeout: CloseoutRecord; entry: null }
  | { kind: "entry"; closeout: null; entry: OperationalEntry | null };

export type LoadOperationalEntriesOptions = {
  invalidateScopes?: OperationalInvalidationScope[] | "all";
};

export type LoadOperationalEntriesFn = (
  options?: LoadOperationalEntriesOptions,
) => Promise<OperationalEntry[]>;

export type EntryIsVoidedFn = (entry: OperationalEntry | Record<string, unknown>) => boolean;

export type EntryIsActiveFn = (entry: OperationalEntry | Record<string, unknown>) => boolean;

export type NotifyOperationalSyncWriteFn = (eventType: OperationalSyncEventType | string) => void;

export type UseOperationalSyncProps = {
  enabled: boolean;
  organizationId: string;
  actorUserId: string;
  actorRole: string;
  employee: boolean;
  ownerPage: string;
  employeePage: string;
  ownerEntryActive: boolean;
  employeeEntryActive: boolean;
  reloadOperationalEntries: LoadOperationalEntriesFn;
  closeoutsSyncEnabled: boolean;
  entriesSyncEnabled: boolean;
};

export type OperationalSyncScheduleOptions = {
  skipSelfEcho?: boolean;
  actorUserId?: string;
};

export type UseTaqfeelahAppOperationalEntriesProps = {
  lang: DisplayLang;
  loggedIn: boolean;
  runtimeApiStoresReady: boolean;
  employee: boolean;
  entriesApiEnabled: boolean;
  entriesApiStrictMode: boolean;
  closeoutsApiOrganizationId: string;
  apiActorUserId: string;
  apiActorRole: string;
  apiTargetStoreIdsKey: string;
  phase9ApiEnabled: boolean;
  setLastCloseoutDates: SetState<Record<string, string>>;
};

export type CreateOperationalEntryInApiParams = {
  payload: OperationalEntryPayload;
  actorUserId: string;
  actorRole: string;
};

export type SyncCloseoutOptions = {
  force?: boolean;
};

export type UseRegisterVoidRestoreHandlersProps = {
  lang: DisplayLang;
  voidTarget?: OperationalEntry | null;
  setVoidTarget?: (value: OperationalEntry | null) => void;
  restoreTarget?: OperationalEntry | null;
  setRestoreTarget?: (value: OperationalEntry | null) => void;
  operationalEntries?: OperationalEntry[];
  archivedBusinessIds?: string[];
  entriesApiEnabled?: boolean;
  closeoutsApiOrganizationId?: string;
  ownerApiUserId?: string;
  currentOwnerActor: OperationalEntryActor;
  entryIsActive?: EntryIsActiveFn;
  entryIsVoided?: EntryIsVoidedFn;
  loadOperationalEntriesFromApi?: LoadOperationalEntriesFn;
  setOperationalEntries?: SetState<OperationalEntry[]>;
  setLastCloseoutDates?: SetState<Record<string, string>>;
  setSelected?: (value: OperationalEntry | null) => void;
  notifyOperationalSyncWrite?: NotifyOperationalSyncWriteFn | null;
};

export type UseRegisterDuplicateSummaryHandlersProps = {
  lang: DisplayLang;
  pendingDuplicateSummary?: PendingDuplicateSummary;
  setPendingDuplicateSummary?: (value: PendingDuplicateSummary) => void;
  entriesApiEnabled?: boolean;
  entriesApiDbSource?: boolean;
  phase9ApiEnabled?: boolean;
  closeoutsApiOrganizationId?: string;
  ownerApiUserId?: string;
  currentOwnerActor: OperationalEntryActor;
  activeEmployee?: OperationalEntryActor | null;
  entryIsActive?: EntryIsActiveFn;
  loadOperationalEntriesFromApi?: LoadOperationalEntriesFn;
  setOperationalEntries?: SetState<OperationalEntry[]>;
  setLastCloseoutDates?: SetState<Record<string, string>>;
  setAcknowledgedDuplicateSales?: SetState<Record<string, string>>;
  setOwnerPage?: (value: string) => void;
  setEmployeePage?: (value: string) => void;
  setSaved?: (value: boolean) => void;
  pushCloseoutAlert?: (
    payload: OperationalEntryPayload,
    entry: OperationalEntry,
    actor: OperationalEntryActor,
  ) => void;
  saveOwner?: (payload: OperationalEntryPayload) => Promise<void>;
  persistEmployeeEntry?: (payload: OperationalEntryPayload) => Promise<void>;
  savingRef: MutableRefObject<boolean>;
  setSaving?: (value: boolean) => void;
};

export type UseRegisterOperationOpenHandlersProps = {
  operationalEntries?: OperationalEntry[];
  archivedBusinessIds?: string[];
  entryIsVoided?: EntryIsVoidedFn;
  bindsToServerAuth?: boolean;
  closeoutsApiDbSource?: boolean;
  readDailyCloseouts?: () => CloseoutRecord[];
  setSelected?: (value: OperationalEntry | null) => void;
  setVoidTarget?: (value: OperationalEntry | null) => void;
  setRestoreTarget?: (value: OperationalEntry | null) => void;
  setOwnerManageCloseout?: (value: CloseoutRecord | null) => void;
};

export type UseRegisterOperationsStateProps =
  UseRegisterVoidRestoreHandlersProps
  & UseRegisterDuplicateSummaryHandlersProps
  & UseRegisterOperationOpenHandlersProps;

export type RegisterEntriesCatalogCache = {
  key: string;
  value: OperationalEntry[];
};

export type ReadRegisterEntriesCatalogFn = (queryClient: QueryClient) => OperationalEntry[];

export type OwnerOutflowCloseoutPayload = OperationalEntryPayload;

export type RefreshOperationalEntriesResult = {
  refreshed: OperationalEntry[];
  refreshFailed: boolean;
  refreshError?: unknown;
};
