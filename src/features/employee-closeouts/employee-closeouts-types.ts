import type { MutableRefObject, ReactNode } from "react";
import type {
  CloseoutOutflow,
  CloseoutShareTotals,
  CloseoutShareTotalsInput,
  CloseoutSyncLang,
  DailyCloseoutRecord,
  NotebookPatternId,
  NotebookThemeId,
  SalesChannelConfig,
  StoreRef,
} from "@/features/daily-closeouts/daily-closeouts-types";

export type EmployeeStaffMember = {
  id?: string;
  apiUserId?: string;
  legacyId?: string;
  pin?: string;
  nameAr?: string;
  nameEn?: string;
  active?: boolean;
  removed?: boolean;
  storeIds?: string[];
};

export type EmployeeActor = EmployeeStaffMember | string;

export type EmployeeHistoryVisibility = "week" | "month" | "all";

export type EmployeeCloseoutsViewGate = "loading" | "no-store" | "ready";

export type RuntimeApiMaps = {
  userIdMap?: Record<string, string>;
  storeIdMap?: Record<string, string>;
};

export type EmployeeBusinessRef = StoreRef;

export type CloseoutOutflowRow = CloseoutOutflow & {
  id: string;
  amount: number;
  typeLabel?: string;
  attachments?: string[];
};

export type CloseoutAttachmentPreview = string | { dataUrl?: string } | null;

export type EmployeeShareTotals = CloseoutShareTotalsInput | CloseoutShareTotals | null | undefined;

export type ToggleAnchorRef = {
  closeoutId: string;
  top: number;
  scrollContainer: HTMLElement | null;
} | null;

export type DisplayCloseout = DailyCloseoutRecord & {
  uiExpanded?: boolean;
  isPrevious?: boolean;
  dailySequence?: number | null;
};

export type EmployeeCloseoutsViewProps = {
  lang: CloseoutSyncLang;
  employee: EmployeeStaffMember;
  currentStore: StoreRef | null;
  assignedStores?: StoreRef[];
  onSelectStore?: (storeId: string) => void | Promise<void>;
  salesChannels?: SalesChannelConfig[];
  notebookTheme?: NotebookThemeId | string;
  notebookPattern?: NotebookPatternId | string;
  employeeHistoryVisibility?: EmployeeHistoryVisibility | string;
  formatCalendarDate?: (date: string, lang: CloseoutSyncLang) => string;
  channelLabel?: (channel: SalesChannelConfig, lang: CloseoutSyncLang) => string;
  settingsPanel?: (args: { onBack: () => void }) => ReactNode;
  onRegisterAdd?: (handler: (() => void) | null) => void;
  onRegisterSettingsOpener?: (handler: (() => void) | null) => void;
  onEntryActiveChange?: (active: boolean) => void;
  onCloseoutSubmitted?: () => void;
  findForStoreDate?: (storeId: string, date: string) => DailyCloseoutRecord | null;
  saving?: boolean;
  employeeRuntimeReady?: boolean;
  trustServerDaySequenceOnly?: boolean;
  entryPhaseRef?: MutableRefObject<unknown> | null;
  pageTitle?: string;
  showStorePicker?: boolean;
  attachmentsApiEnabled?: boolean;
  attachmentsApiOrganizationId?: string;
  attachmentsApiActorUserId?: string;
  attachmentsApiActorRole?: string;
  sessionDisplayName?: string;
  storeChannelSettings?: Record<string, unknown>;
};

export type UseEmployeeCloseoutsViewStateParams = {
  lang: CloseoutSyncLang;
  employee: EmployeeStaffMember;
  currentStore: StoreRef | null;
  assignedStores?: StoreRef[];
  onSelectStore?: (storeId: string) => void | Promise<void>;
  notebookTheme?: NotebookThemeId | string;
  employeeHistoryVisibility?: EmployeeHistoryVisibility;
  findForStoreDate?: (storeId: string, date: string) => DailyCloseoutRecord | null;
  onRegisterAdd?: (handler: (() => void) | null) => void;
  onRegisterSettingsOpener?: (handler: (() => void) | null) => void;
  onEntryActiveChange?: (active: boolean) => void;
  onCloseoutSubmitted?: () => void;
  entryPhaseRef?: MutableRefObject<unknown> | null;
  employeeRuntimeReady?: boolean;
  trustServerDaySequenceOnly?: boolean;
  salesChannels?: SalesChannelConfig[];
};

export type CloseoutShareModalProps = {
  lang: CloseoutSyncLang;
  open: boolean;
  closeout: DailyCloseoutRecord | null;
  storeName?: string;
  employeeName?: string;
  notebookTheme?: NotebookThemeId | string;
  formatCalendarDate?: (date: string, lang: CloseoutSyncLang) => string;
  newlySubmitted?: boolean;
  onClose: () => void;
};

export type ResolveCloseoutStoreNameParams = {
  preferredStoreName?: string;
  closeout?: DailyCloseoutRecord | { storeName?: string; store?: StoreRef | string } | null;
  currentStore?: StoreRef | string | null;
  lang?: CloseoutSyncLang | string;
};
