import type { Dispatch, MutableRefObject, ReactNode, RefObject, SetStateAction } from "react";
import type { LucideIcon } from "lucide-react";
import type { DisplayLang } from "@/core/i18n/display-locale";
import type { NotebookPatternId, NotebookThemeId } from "@/features/daily-closeouts/daily-closeouts-types";
import type { NotebookThemeStyle } from "@/features/daily-closeouts/notebook-themes";
import type {
  OperationalEntry,
  OperationalEntryActor,
  OperationalEntryPayload,
  RegisterLogFilters,
} from "@/features/entries/client/entries-client-types";
import type { CreateOperationalEntryInApiParams } from "@/features/operations/client/operations-client-types";
import type { RegisterCloseoutSummary } from "@/features/entries/client/register-log-display";
import type { DailyCloseoutRecord } from "@/features/daily-closeouts/daily-closeouts-types";
import type { OwnerNotebookNote } from "@/features/owner-notebook/owner-notebook-types";
import type { StaffMember as OrgStaffMember } from "@/features/org-config/client/org-config-client-types";
import type {
  CloseoutRecord,
  LoadOperationalEntriesFn,
  NotifyOperationalSyncWriteFn,
  PendingDuplicateSummary,
  UseOperationalSyncProps,
} from "@/features/operations/client/operations-client-types";
import type {
  OrgConfigRuntimeSnapshot,
  OwnerSettingsDeleteTarget,
  StaffMember,
  StoreChannelConfig,
} from "@/features/org-config/client/org-config-client-types";
import type { ResolvedOrganizationEntitlements } from "@/features/billing/client/billing-client-types";
import type { StoreOperationalSettings } from "@/domain/store-operational-settings/types";

export type { DisplayLang, OperationalEntry, OperationalEntryActor, OperationalEntryPayload, NotebookPatternId, NotebookThemeId, RegisterLogFilters };

export type AppOperationalEntry = OperationalEntry & {
  closeoutOwnerEditedByUserId?: string;
  closeoutOwnerEditedByName?: string;
};

export type AppAttachmentPreviewState = {
  src: string;
  shareContext?: Record<string, unknown> | null;
} | null;

export type AppPendingDuplicateSummary = (NonNullable<PendingDuplicateSummary> & {
  previousEntries?: OperationalEntry[];
}) | null;

export type AppLang = DisplayLang;

export type AppAuthScreen = "gateway" | "owner" | "employee" | (string & {});

export type AppOwnerPage =
  | "home"
  | "register"
  | "closeouts"
  | "notebook"
  | "settings"
  | (string & {});

export type AppEmployeePage = "home" | "entries" | "settings" | (string & {});

export type AppStoreRecord = {
  sales: number;
  expense: number;
  ratio: string;
  net: number;
  proofs: number;
};

export type AppBusiness = {
  id: string;
  nameKey?: string;
  nameAr?: string;
  nameEn?: string;
  shortKey?: string;
  locationKey?: string;
  displayName?: string;
  customLocation?: string;
  day?: AppStoreRecord;
  month?: AppStoreRecord;
  [key: string]: unknown;
};

export type AppStaffMember = {
  id?: string;
  nameAr?: string;
  nameEn?: string;
  active?: boolean;
  storeIds?: string[];
  pin?: string;
  [key: string]: unknown;
};

export type AppOwnerActor = OperationalEntryActor & {
  role?: string;
  userId?: string;
  nameAr?: string;
  nameEn?: string;
};

export type AppChannel = {
  id: string;
  text?: string;
  kind?: string;
  icon?: unknown;
  amount?: number;
  [key: string]: unknown;
};

export type AppExpenseCategory = {
  id: string;
  label: string;
  amount?: number;
};

export type AppOutflowCategory = AppExpenseCategory & {
  amount?: number;
};

export type AppTextFn = (lang: AppLang, key: string) => string;

export type AppMoneyFn = (value: number, lang: AppLang) => string;

export type AppChannelNameFn = (
  channel: AppChannel | Record<string, unknown>,
  lang: AppLang,
) => string;

export type AppFormatCalendarDateFn = (
  date: string,
  lang: AppLang,
) => string;

export type TaqfeelahAppCallback = {
  bivarianceHack(...args: unknown[]): void;
}["bivarianceHack"];

export type AppSetState<T = unknown> = {
  bivarianceHack(value: SetStateAction<T>): void;
}["bivarianceHack"];

export type AppRef<T> = MutableRefObject<T | null>;

export type AppAttachmentsApiProps = {
  attachmentsApiEnabled?: boolean;
  attachmentsApiOrganizationId?: string;
  attachmentsApiActorUserId?: string;
  attachmentsApiActorRole?: string;
};

export type AppEntryAttachmentsApiProps = {
  entryAttachmentsApiEnabled?: boolean;
  entryAttachmentsApiOrganizationId?: string;
  entryAttachmentsApiActorUserId?: string;
  entryAttachmentsApiActorRole?: string;
};

export type AppLangProps = {
  lang: AppLang;
};

export type AppNotebookThemeProps = {
  notebookTheme?: NotebookThemeId | string;
  notebookPattern?: NotebookPatternId | string;
};

export type AppOperationalEntryList = OperationalEntry[];

export type AppCloseoutRecord = CloseoutRecord;

export type AppStoreChannelSettings = Record<string, StoreChannelConfig>;

export type AppStoreOperationalSettings = Record<string, StoreOperationalSettings>;

export type AppVoidRestoreTarget = OperationalEntry | null;

export type AppShareSnapshot = Record<string, unknown> | null;

export type AppSavedOutflowShareTarget = OperationalEntry | null;

export type AppSelectedOperation = OperationalEntry | null;

export type AppReloadOperationalEntriesFn = LoadOperationalEntriesFn;

export type AppChildrenProps = {
  children?: ReactNode;
};

export type SettingsTabItem = {
  id: string;
  label: string;
  count?: number;
  hideCount?: boolean;
  activeClass: string;
  inactiveClass: string;
  badgeActiveClass?: string;
  badgeInactiveClass?: string;
  contentSurfaceClass: string;
  contentAccentClass: string;
};

export type SettingsTabCounts = Partial<Record<string, number>>;

export type SettingsSection =
  | "stores-team"
  | "account"
  | "appearance"
  | "support"
  | "stores"
  | "team"
  | "home"
  | "subscription"
  | (string & {});

export type OwnerSettingsDeleteDialogProps = {
  lang: DisplayLang;
  deleteTarget: OwnerSettingsDeleteTarget | null;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
  translate: (key: string) => string;
};

export type FinancialRow = {
  id?: string;
  label: string;
  value: string;
  valueClassName?: string;
};

export type NotebookShareSnapshot = Record<string, unknown> & {
  period?: string;
  screen?: string;
  tab?: string;
  selectedBusiness?: string;
  selectedDate?: string;
  selectedYear?: string;
  selectedMonth?: string;
  customFrom?: string;
  customTo?: string;
  includedBusinessIds?: string[];
  outflowCategory?: string;
  theme?: NotebookThemeId | string;
  pattern?: NotebookPatternId | string;
  showSummaryDetails?: boolean;
  showDetails?: boolean;
  showOutflowTransactions?: boolean;
  reportChannels?: AppChannel[];
  summaryBusinessRows?: Array<Record<string, unknown>>;
  summaryRecord?: AppStoreRecord;
  snapshotOutflowCategories?: Array<{ id: string; amount?: number }>;
  snapshotChannelRows?: Array<{ label?: string; amount?: number } & Record<string, unknown>>;
};

export type NotebookShareChannelRow = {
  id: string;
  label: string;
  amount: number;
};

export type NotebookShareDayRow = {
  date: string;
  sales: number;
  expense: number;
  net?: number;
};

export type NotebookShareBusinessRow = {
  business: AppBusiness;
  sales: number;
  expense: number;
  net: number;
  ratio?: string;
};

export type NotebookShareDetailRow = {
  label: string;
  ratio: string;
  value: string;
  tone?: string;
};

export type NotebookShareExportTable = {
  headers: string[];
  rows: string[][];
};

export type NotebookShareModel = {
  sharePeriod: string;
  monthly: boolean;
  isOutflowReport: boolean;
  isChannelsReport: boolean;
  isDaysReport: boolean;
  isProofsReport: boolean;
  combined: boolean;
  shareDate: string;
  record: AppStoreRecord;
  netMarginRatio: string;
  title: string;
  periodLabel: string;
  outflowCategoryLabel: string;
  activeTheme: NotebookThemeStyle;
  lines: { backgroundColor?: string; backgroundImage: string };
  shareCaption: string;
  detailedSummary: boolean;
  showOutflowOperations: boolean;
  shareOutflowOperations: OperationalEntry[];
  filteredOutflowEntries: OperationalEntry[];
  outflowTotal: number;
  outflowAverage: number;
  shareChannelRows: NotebookShareChannelRow[];
  shareDayRows: NotebookShareDayRow[];
  shareProofEntries: OperationalEntry[];
  shareBusinessRows: NotebookShareBusinessRow[];
  salesDetailRows: NotebookShareDetailRow[];
  outflowDetailRows: NotebookShareDetailRow[];
  exportTitle: string;
  exportTable: NotebookShareExportTable;
  safeExportName: string;
  imageFilename: string;
};

export type BuildNotebookShareModelInput = {
  snapshot: NotebookShareSnapshot;
  lang: DisplayLang;
  businessesList: AppBusiness[];
  operationalEntries: OperationalEntry[];
  archivedBusinessIds: string[];
  apiEntries?: OperationalEntry[] | null;
  apiRecord?: AppStoreRecord | null;
  apiChannelRows?: NotebookShareChannelRow[] | null;
  apiDayRows?: NotebookShareDayRow[] | null;
};

export type OperationalSyncBridgeProps = UseOperationalSyncProps & {
  notifyLocalWriteRef?: MutableRefObject<NotifyOperationalSyncWriteFn | null> | null;
};

export type OwnerSettingsApiContext = {
  enabled?: boolean;
  organizationId?: string;
  actorUserId?: string;
  actorRole?: string;
  loading?: boolean;
  hydrated?: boolean;
  reload?: () => void | Promise<void>;
  flushPersist?: (
    overrides?: Partial<OrgConfigRuntimeSnapshot>,
    options?: { employeePins?: Record<string, string> },
  ) => Promise<void>;
} | null;

export type OwnerSettingsScreenProps = {
  lang: DisplayLang;
  notebookTheme: NotebookThemeId | string;
  setNotebookTheme: (value: NotebookThemeId | string) => void;
  notebookPattern: NotebookPatternId | string;
  setNotebookPattern: (value: NotebookPatternId | string) => void;
  employeePreferences?: Record<string, unknown>;
  ownerShellPreferences?: Record<string, unknown>;
  storeChannelSettings: Record<string, StoreChannelConfig>;
  setStoreChannelSettings: (value: Record<string, StoreChannelConfig>) => void;
  storeOperationalSettings: Record<string, StoreOperationalSettings>;
  setStoreOperationalSettings: (value: Record<string, StoreOperationalSettings>) => void;
  configuredBusinesses: AppBusiness[];
  setConfiguredBusinesses: (value: AppBusiness[]) => void;
  archivedBusinessIds: string[];
  setArchivedBusinessIds: (value: string[]) => void;
  staff: StaffMember[];
  setStaff: (value: StaffMember[]) => void;
  ownerProfile: Record<string, unknown>;
  setOwnerProfile: (value: Record<string, unknown>) => void;
  authOwnerUsername: string;
  setAuthOwnerUsername: (value: string) => void;
  authOwnerPassword: string;
  setAuthOwnerPassword: (value: string) => void;
  authEmployeePins: Record<string, string>;
  setAuthEmployeePins: (value: Record<string, string>) => void;
  operationalEntries?: OperationalEntry[];
  selectedBusiness: string;
  setSelectedBusiness: (value: string) => void;
  setOwnerPage: (value: string) => void;
  setArchivedReadOnlyBusinessId: (value: string | null) => void;
  setLastCloseoutDates: Dispatch<SetStateAction<Record<string, string>>>;
  onPersistSettingsNow?: (() => void | Promise<void>) | null;
  onLogout?: () => void;
  onOpenSupport?: () => void;
  onOpenHelp?: () => void;
  inviteApiContext?: OwnerSettingsApiContext;
  billingApiContext?: OwnerSettingsApiContext;
  orgConfigApiContext?: OwnerSettingsApiContext;
  initialSettingsSection?: string;
};

export type OwnerSettingsStoreFlattenedPanelProps = {
  lang: DisplayLang;
  selectedStore: AppBusiness;
  displayBusinessName: (business: AppBusiness) => string;
  displayLocation: (business: AppBusiness) => string;
  archived: boolean;
  operationalConfig: StoreOperationalSettings;
  draftStoreName: string;
  setDraftStoreName: (value: string) => void;
  draftStoreLocation: string;
  setDraftStoreLocation: (value: string) => void;
  saveStoreProfile: () => void;
  channelConfig: StoreChannelConfig;
  retiredChannels: Array<AppChannel | Record<string, unknown>>;
  newCustomIncomeSourceName: string;
  setNewCustomIncomeSourceName: (value: string) => void;
  toggleChannel: (channelId: string) => void;
  requestRetireChannel: (channel: AppChannel | Record<string, unknown> | string) => void;
  restoreSalesChannel: (channel: AppChannel | Record<string, unknown> | string) => void;
  deleteCustomIncomeSource: (channel: AppChannel | Record<string, unknown> | string) => void;
  addCustomIncomeSource: (names?: { nameAr?: string; nameEn?: string }) => void;
  saveChannelSettings: () => void;
  cancelChannelDraft: () => void;
  toggleCategory: (categoryId: string) => void;
  saveOperationalSettings: () => void;
  cancelOperationalDraft: () => void;
  notebookTheme: NotebookThemeId | string;
  updateOperationalDraft: (patch: Partial<StoreOperationalSettings>) => void;
  closeStore: () => void;
  setArchivedReadOnlyBusinessId: (value: string | null) => void;
  setSelectedBusiness: (value: string) => void;
  setOwnerPage: (value: string) => void;
  toggleArchive: (storeId: string) => void;
  requestArchiveStore: (store: AppBusiness) => void;
  openStoreDelete: (store: AppBusiness) => void;
  settingsSuccess: boolean;
  settingsNotice: string;
  deleteDialogProps: OwnerSettingsDeleteDialogProps;
  storePanel?: string;
  openStorePanel?: (panel: string) => void;
};

export type OwnerSettingsTabbedShellCallbacks = {
  onLogout: () => void;
  onOpenSupport?: () => void;
  onOpenHelp?: () => void;
};

export type OwnerSettingsTabbedShellState = Record<string, unknown> & {
  lang: DisplayLang;
  section: string;
  setSection: (value: string) => void;
  cancelManagingTeam?: () => void;
  entitlements: Record<string, unknown> | null;
  entitlementsLoading: boolean;
  ownerProfile: Record<string, unknown>;
  ownerAccount: Record<string, unknown> | null;
};

export type OwnerSettingsTabbedShellProps = {
  state: OwnerSettingsTabbedShellState;
  callbacks: OwnerSettingsTabbedShellCallbacks;
};

export type RegisterViewCounts = Partial<Record<"report" | "closeouts" | "operations" | "attachments", number>>;

export type OwnerCloseoutModalsProps = {
  lang: AppLang;
  ownerManageCloseout: DailyCloseoutRecord | null;
  ownerDisplayName?: string;
  ownerNotebookTheme?: NotebookThemeId | string;
  resolveSalesChannels?: (storeId: string) => AppChannel[];
  channelLabel?: (channel: AppChannel | Record<string, unknown>) => string;
  onCloseoutUpdated?: (closeout: DailyCloseoutRecord) => void | Promise<void>;
  onCloseoutDeleted?: (closeout: DailyCloseoutRecord) => void | Promise<void>;
  onClose: () => void;
  onOwnerEditCloseout?: (closeout: DailyCloseoutRecord) => void;
  attachmentsApiEnabled?: boolean;
  attachmentsApiOrganizationId?: string;
  attachmentsApiActorUserId?: string;
  attachmentsApiActorRole?: string;
};

export type OwnerCloseoutEditFlowProps = {
  lang: AppLang;
  editCloseout: DailyCloseoutRecord | null;
  ownerActor: AppOwnerActor | Record<string, unknown>;
  ownerNotebookTheme?: NotebookThemeId | string;
  resolveSalesChannels?: (storeId: string) => AppChannel[];
  channelLabel?: (channel: AppChannel | Record<string, unknown>) => string;
  onCloseoutUpdated?: (closeout: DailyCloseoutRecord) => void | Promise<void>;
  onClose: () => void;
};

export type NotebookShareModalProps = {
  lang: AppLang;
  snapshot: NotebookShareSnapshot | null;
  onClose: () => void;
  businessesList?: AppBusiness[];
  operationalEntries?: OperationalEntry[];
  archivedBusinessIds?: string[];
  notebookExportApiEnabled?: boolean;
  notebookExportAuth?: Record<string, unknown>;
  allowedFormats?: string[];
};

export type OwnerNotebookShareModalProps = {
  lang: AppLang;
  note: OwnerNotebookNote | null;
  onClose: () => void;
};

export type EmployeeSettingsScreenProps = {
  lang: AppLang;
  onBack: () => void;
  currentStore: AppBusiness | null;
  assignedStores: AppBusiness[];
  onSelectStore: (storeId: string) => void;
  employeeNotebookTheme: NotebookThemeId | string;
  setEmployeeNotebookTheme: (theme: NotebookThemeId | string) => void;
  onOpenSupport: () => void;
  onOpenHelp: () => void;
};

export type OwnerNotebookScreenProps = {
  lang: AppLang;
  notebookTheme?: NotebookThemeId | string;
  notebookPattern?: NotebookPatternId | string;
  organizationId?: string;
  userId?: string;
  apiEnabled?: boolean;
};

export type EntryAttachmentApiContext = Record<string, unknown> | null | undefined;

export type NotebookShareImagePreviewProps = {
  previewRef: RefObject<HTMLDivElement | null>;
  lang: DisplayLang;
  snapshot: NotebookShareSnapshot;
  model: NotebookShareModel;
};

export type NotebookShareExportPayload = Record<string, unknown>;

export type IndexTabBorderOptions = {
  tier?: "main" | "sub";
};

export type IconComponent = LucideIcon;

export type OwnerSettingsViewState = Record<string, unknown> & {
  lang: DisplayLang;
  section: string;
  setSection: (value: string) => void;
  deleteDialogProps: OwnerSettingsDeleteDialogProps;
  draftOwnerName: string;
  setDraftOwnerName: (value: string) => void;
  draftAuthOwnerUsername: string;
  setDraftAuthOwnerUsername: (value: string) => void;
  draftAuthOwnerPassword: string;
  setDraftAuthOwnerPassword: (value: string) => void;
  ownerProfileDirty: boolean;
  authDirty: boolean;
  saveOwnerProfile: () => void;
  saveAuthCredentials: () => void;
  settingsNotice: string;
  settingsSuccess: boolean;
  serverAuthMode?: boolean;
  ownerAccount: Record<string, unknown> | null;
  ownerAccountLoading: boolean;
  ownerAccountError: string;
  reloadOwnerAccount: () => void;
  showAddStore: boolean;
  setShowAddStore: (value: boolean) => void;
  newStoreName: string;
  setNewStoreName: (value: string) => void;
  newStoreLocation: string;
  setNewStoreLocation: (value: string) => void;
  addStore: () => void | Promise<void>;
  activeStoredBusinesses: AppBusiness[];
  archivedStoredBusinesses: AppBusiness[];
  showArchivedStores: boolean;
  setShowArchivedStores: (value: boolean) => void;
  displayBusinessName: (business: AppBusiness) => string;
  displayLocation: (business: AppBusiness) => string;
  openStore: (storeId: string) => void;
  orgConfigApiContext?: OwnerSettingsApiContext;
  storeSaving: boolean;
  entitlements: ResolvedOrganizationEntitlements | null;
  entitlementsLoading: boolean;
  entitlementsError: string;
  reloadEntitlements: () => void | Promise<void>;
  managingTeam: boolean;
  startManagingTeam: () => void;
  cancelManagingTeam: () => void;
  visibleStaff: StaffMember[];
  employeeStoreIds: (person: StaffMember) => string[];
  toggleEmployeeActive: (personId: string) => void;
  setDeleteTarget: (target: OwnerSettingsDeleteTarget | null) => void;
  toggleEmployeeStore: (personId: string, storeId: string) => void;
  draftAuthEmployeePins: Record<string, string>;
  updateDraftEmployeePin: (personId: string, pin: string) => void;
  updateEmployeeMobile: (personId: string, mobile: string) => void;
  newEmployeeName: string;
  setNewEmployeeName: (value: string) => void;
  newEmployeeMobile: string;
  setNewEmployeeMobile: (value: string) => void;
  newEmployeeStoreIds: string[];
  toggleNewEmployeeStore: (storeId: string) => void;
  addStaff: () => void;
  teamSaving: boolean;
  saveManagingTeam: () => void | Promise<void>;
  inviteApiContext?: OwnerSettingsApiContext;
  draftNotebookTheme: NotebookThemeId | string;
  setDraftNotebookTheme: (value: NotebookThemeId | string) => void;
  notebookTheme: NotebookThemeId | string;
  draftNotebookPattern: NotebookPatternId | string;
  setDraftNotebookPattern: (value: NotebookPatternId | string) => void;
  notebookPattern: NotebookPatternId | string;
  themeDirty: boolean;
  setThemeDirty: (value: boolean) => void;
  setNotebookTheme: (value: NotebookThemeId | string) => void;
  setNotebookPattern: (value: NotebookPatternId | string) => void;
  showSettingsSaved: () => void;
  selectedStore: AppBusiness | null;
  storePanel: string;
  draftStoreName: string;
  setDraftStoreName: (value: string) => void;
  draftStoreLocation: string;
  setDraftStoreLocation: (value: string) => void;
  saveStoreProfile: () => void | Promise<void>;
  backFromStorePanel: () => void;
  channelConfig: StoreChannelConfig;
  retiredChannels: Array<AppChannel | Record<string, unknown>>;
  newCustomIncomeSourceName: string;
  setNewCustomIncomeSourceName: (value: string) => void;
  toggleChannel: (channelId: string) => void;
  requestRetireChannel: (channel: AppChannel | Record<string, unknown> | string) => void;
  restoreSalesChannel: (channel: AppChannel | Record<string, unknown> | string) => void;
  deleteCustomIncomeSource: (channel: AppChannel | Record<string, unknown> | string) => void;
  addCustomIncomeSource: (names?: { nameAr?: string; nameEn?: string }) => void;
  saveChannelSettings: () => void | Promise<void>;
  operationalConfig: StoreOperationalSettings;
  toggleCategory: (categoryId: string) => void;
  saveOperationalSettings: () => void | Promise<void>;
  updateOperationalDraft: (patch: Partial<StoreOperationalSettings>) => void;
  archived: boolean;
  activeChannelCount: number;
  activeCategoryCount: number;
  openStorePanel: (panel: string) => void;
  setArchivedReadOnlyBusinessId: (value: string | null) => void;
  setSelectedBusiness: (value: string) => void;
  setOwnerPage: (value: string) => void;
  toggleArchive: (storeId: string) => void;
  requestArchiveStore: (store: AppBusiness) => void;
  openStoreDelete: (store: AppBusiness) => void;
  closeStore: () => void;
};

type StorePanelLangProps = { lang: DisplayLang };

export type OwnerSettingsStoreProfilePanelProps = StorePanelLangProps & {
  draftStoreName: string;
  setDraftStoreName: (value: string) => void;
  draftStoreLocation: string;
  setDraftStoreLocation: (value: string) => void;
  saveStoreProfile: () => void;
  backFromStorePanel: () => void;
  deleteDialogProps: OwnerSettingsDeleteDialogProps;
};

export type OwnerSettingsStoreChannelsPanelProps = StorePanelLangProps & {
  channelConfig: StoreChannelConfig;
  retiredChannels: AppChannel[];
  newCustomIncomeSourceName: string;
  setNewCustomIncomeSourceName: (value: string) => void;
  toggleChannel: (channelId: string) => void;
  requestRetireChannel: (channel: AppChannel | Record<string, unknown> | string) => void;
  restoreSalesChannel: (channel: AppChannel | Record<string, unknown> | string) => void;
  deleteCustomIncomeSource: (channel: AppChannel | Record<string, unknown> | string) => void;
  addCustomIncomeSource: (names?: { nameAr?: string; nameEn?: string }) => void;
  settingsNotice: string;
  backFromStorePanel: () => void;
  saveChannelSettings: () => void;
  deleteDialogProps: OwnerSettingsDeleteDialogProps;
};

export type OwnerSettingsStoreExpensesPanelProps = StorePanelLangProps & {
  operationalConfig: StoreOperationalSettings;
  toggleCategory: (categoryId: string) => void;
  settingsNotice: string;
  backFromStorePanel: () => void;
  saveOperationalSettings: () => void;
};

export type OwnerSettingsStoreAlertsPanelProps = StorePanelLangProps & {
  operationalConfig: StoreOperationalSettings;
  notebookTheme: NotebookThemeId | string;
  updateOperationalDraft: (patch: Partial<StoreOperationalSettings>) => void;
  backFromStorePanel: () => void;
  saveOperationalSettings: () => void;
};

export type OwnerSettingsStoreOverviewPanelProps = StorePanelLangProps & {
  selectedStore: AppBusiness;
  displayBusinessName: (business: AppBusiness) => string;
  displayLocation: (business: AppBusiness) => string;
  archived: boolean;
  activeChannelCount: number;
  activeCategoryCount: number;
  operationalConfig: StoreOperationalSettings;
  openStorePanel: (panel: string) => void;
  setArchivedReadOnlyBusinessId: (value: string | null) => void;
  setSelectedBusiness: (value: string) => void;
  setOwnerPage: (value: string) => void;
  toggleArchive: (storeId: string) => void;
  requestArchiveStore: (store: AppBusiness) => void;
  openStoreDelete: (store: AppBusiness) => void;
  settingsSuccess: boolean;
  closeStore: () => void;
  deleteDialogProps: OwnerSettingsDeleteDialogProps;
};

export type OwnerSettingsSectionRenderOptions = {
  embedded?: boolean;
};

export type OwnerSettingsSectionCommonProps = {
  lang: DisplayLang;
  setSection: (value: string) => void;
  embedded?: boolean;
};

export type OwnerSettingsScreenHandlersContext = Record<string, unknown> & {
  setters: Record<string, AppSetState>;
  showSettingsSaved: () => void;
};

export type OwnerSettingsIncomeSourcesEditorProps = {
  lang: DisplayLang;
  channelConfig: StoreChannelConfig;
  retiredChannels: AppChannel[];
  newCustomIncomeSourceName: string;
  setNewCustomIncomeSourceName: (value: string) => void;
  toggleChannel: (channelId: string) => void;
  requestRetireChannel: (channel: AppChannel | Record<string, unknown> | string) => void;
  restoreSalesChannel: (channel: AppChannel | Record<string, unknown> | string) => void;
  deleteCustomIncomeSource: (channel: AppChannel | Record<string, unknown> | string) => void;
  addCustomIncomeSource: (names?: { nameAr?: string; nameEn?: string }) => void;
  text: (lang: DisplayLang, key: string) => string;
  channelName: (channel: AppChannel | Record<string, unknown>, lang: DisplayLang) => string;
};

export type OwnerSettingsTeamRosterProps = Record<string, unknown> & {
  lang: DisplayLang;
  managingTeam: boolean;
  startManagingTeam: () => void;
  cancelManagingTeam: () => void;
  visibleStaff: StaffMember[];
  employeeStoreIds: (person: StaffMember) => string[];
  toggleEmployeeActive: (personId: string) => void;
  setDeleteTarget: (target: OwnerSettingsDeleteTarget | Record<string, unknown> | null) => void;
  activeStoredBusinesses: AppBusiness[];
  displayBusinessName: (business: AppBusiness) => string;
  toggleEmployeeStore: (personId: string, storeId: string) => void;
  draftAuthEmployeePins: Record<string, string>;
  updateDraftEmployeePin: (personId: string, pin: string) => void;
  updateEmployeeMobile: (personId: string, mobile: string) => void;
  newEmployeeName: string;
  setNewEmployeeName: (value: string) => void;
  newEmployeeMobile: string;
  setNewEmployeeMobile: (value: string) => void;
  newEmployeeStoreIds: string[];
  toggleNewEmployeeStore: (storeId: string) => void;
  addStaff: () => void;
};

export type RegisterUiProps = {
  lang: DisplayLang;
};

export type TaqfeelahAppPageContentProps = {
  lang: AppLang;
  text: AppTextFn;
  channelName: AppChannelNameFn;
  formatCalendarDate: AppFormatCalendarDateFn;
  employee: boolean;
  employeePage: AppEmployeePage;
  activeEmployee: AppStaffMember | null;
  sessionDisplayName?: string;
  employeeRuntimeReady: boolean;
  currentEmployeeBusiness: AppBusiness | null;
  assignedEmployeeBusinesses: AppBusiness[];
  setEmployeeBusinessId: (id: string) => void;
  currentEmployeeChannelConfig: StoreChannelConfig;
  employeeNotebookTheme: NotebookThemeId | string;
  notebookPattern: NotebookPatternId | string;
  employeeThemeOverride: NotebookThemeId | string | null;
  currentEmployeeOperationalConfig: StoreOperationalSettings;
  handleEmployeeNotebookThemeSave: (theme: NotebookThemeId | string) => void;
  setHelpOpen: (open: boolean) => void;
  setEmployeeEntryActive: (active: boolean) => void;
  employeeAddHandlerRef: AppRef<() => void>;
  employeeSettingsOpenerRef: AppRef<() => void>;
  saving: boolean;
  closeoutsApiDbSource: boolean;
  closeoutAttachmentsApiProps: AppAttachmentsApiProps;
  ownerPage: AppOwnerPage;
  ownerCloseoutActor: Record<string, unknown>;
  runtimeApiStoresReady: boolean;
  ownerCloseoutBusiness: AppBusiness | null;
  activeBusinesses: Array<AppBusiness | Record<string, unknown>>;
  setSelectedBusiness: (value: string) => void;
  ownerCloseoutChannelConfig: StoreChannelConfig;
  notebookTheme: NotebookThemeId | string;
  setOwnerEntryActive: (active: boolean) => void;
  ownerAddHandlerRef: AppRef<() => void>;
  setOwnerPage: (page: AppOwnerPage) => void;
  entriesApiDbSource: boolean;
  operationalEntries: OperationalEntry[];
  operationalEntriesLoading: boolean;
  duplicateSalesAlerts: Array<Record<string, unknown>> | unknown[];
  unseenCloseoutAlerts: Array<Record<string, unknown>> | unknown[];
  openCloseoutAlertInRegister: TaqfeelahAppCallback;
  dismissCloseoutAlert: TaqfeelahAppCallback;
  openDuplicateSummaryInRegister: TaqfeelahAppCallback;
  acknowledgeDuplicateSales: TaqfeelahAppCallback;
  handleOpenOwnerOperation: TaqfeelahAppCallback;
  requestVoidOperation: TaqfeelahAppCallback;
  requestRestoreOperation: TaqfeelahAppCallback;
  setOwnerEditCloseout: (closeout: AppCloseoutRecord | null) => void;
  handleOwnerCloseoutDeleted: (closeout: AppCloseoutRecord) => void | Promise<void>;
  setShareSnapshot: AppSetState<AppShareSnapshot>;
  activeViewBusiness: string;
  homeReportChannelConfig: StoreChannelConfig;
  entriesApiEnabled: boolean;
  closeoutsApiEnabled?: boolean;
  closeoutsApiOrganizationId: string | null;
  ownerApiUserId: string | null;
  ownerNotebookApiEnabled?: boolean;
  entryAttachmentsApiProps: AppEntryAttachmentsApiProps;
  saveOwnerSummary: (payload: OperationalEntryPayload) => Promise<void>;
  saveOwner: (payload: OperationalEntryPayload) => Promise<void>;
  storeChannelSettings: AppStoreChannelSettings;
  storeOperationalSettings: AppStoreOperationalSettings;
  duplicateSummaryFocus: Record<string, unknown> | null | unknown;
  archivedReadOnlyBusinessId: string | null;
  selectedBusiness: string;
  reportingBusinesses: Array<AppBusiness | Record<string, unknown>>;
  archivedBusinessIds: string[];
  registerEntriesPaginationEnabled: boolean;
  resolveStoreSalesChannels: (storeId: string) => Array<AppChannel | Record<string, unknown>>;
  configuredBusinesses: Array<AppBusiness | Record<string, unknown>>;
  setConfiguredBusinesses: AppSetState<Array<AppBusiness | Record<string, unknown>>>;
  setArchivedBusinessIds: AppSetState<string[]>;
  staff: Array<AppStaffMember | OrgStaffMember | Record<string, unknown>>;
  setStaff: AppSetState<Array<AppStaffMember | OrgStaffMember | Record<string, unknown>>>;
  ownerProfile: Record<string, unknown>;
  setOwnerProfile: AppSetState<Record<string, unknown>>;
  authOwnerUsername: string;
  setAuthOwnerUsername: (value: string) => void;
  authOwnerPassword: string;
  setAuthOwnerPassword: (value: string) => void;
  authEmployeePins: Record<string, string>;
  setAuthEmployeePins: AppSetState<Record<string, string>>;
  employeePreferences: Record<string, unknown>;
  ownerShellPreferences: Record<string, unknown>;
  setNotebookTheme: (theme: NotebookThemeId | string) => void;
  setNotebookPattern: (pattern: NotebookPatternId | string) => void;
  setStoreChannelSettings: AppSetState<AppStoreChannelSettings>;
  setStoreOperationalSettings: AppSetState<AppStoreOperationalSettings>;
  setArchivedReadOnlyBusinessId: (value: string | null) => void;
  setLastCloseoutDates: AppSetState;
  persistRuntimeSettingsNow: TaqfeelahAppCallback;
  reloadOrgConfig: TaqfeelahAppCallback;
  flushOrgConfigPersist: TaqfeelahAppCallback;
  orgConfigLoading?: boolean;
  orgConfigHydrated?: boolean;
  logout: () => void;
  saved: boolean;
};

export type TaqfeelahAppOverlayStackProps = {
  lang: AppLang;
  employee: boolean;
  employeePage: AppEmployeePage;
  ownerPage: AppOwnerPage;
  employeeEntryActive: boolean;
  ownerEntryActive: boolean;
  employeeAddHandlerRef: AppRef<() => void>;
  handleOwnerQuickAddOpen: () => void;
  changeEmployeePage: (page: AppEmployeePage) => void;
  changeOwnerPage: (page: AppOwnerPage) => void;
  setQuickAddOpen: (open: boolean) => void;
  quickAddOpen: boolean;
  handleOpenQuickAddSummary: () => void;
  handleOpenQuickAddExpense: () => void;
  selected: AppSelectedOperation;
  setSelected: AppSetState;
  requestVoidOperation: TaqfeelahAppCallback;
  requestRestoreOperation: TaqfeelahAppCallback;
  archivedBusinessIds: string[];
  entryAttachmentsApiProps: AppEntryAttachmentsApiProps;
  pendingDuplicateSummary: AppPendingDuplicateSummary;
  setPendingDuplicateSummary: AppSetState;
  activeBusinesses: Array<AppBusiness | Record<string, unknown>>;
  confirmDuplicateSummary: () => void | Promise<void>;
  voidTarget: AppVoidRestoreTarget;
  setVoidTarget: AppSetState;
  confirmVoidOperation: () => void | Promise<void>;
  restoreTarget: AppVoidRestoreTarget;
  setRestoreTarget: AppSetState;
  confirmRestoreOperation: () => void | Promise<void>;
  savedOutflowShareTarget: AppSavedOutflowShareTarget;
  setSavedOutflowShareTarget: AppSetState;
  shareSnapshot: AppShareSnapshot | unknown;
  setShareSnapshot: AppSetState<AppShareSnapshot>;
  reportingBusinesses: Array<AppBusiness | Record<string, unknown>>;
  operationalEntries: OperationalEntry[];
  phase9ApiEnabled: boolean;
  entriesApiEnabled: boolean;
  closeoutsApiEnabled?: boolean;
  runtimeApiAuth: Record<string, unknown>;
  ownerManageCloseout: AppCloseoutRecord | null;
  ownerDisplayName: string;
  notebookTheme: NotebookThemeId | string;
  resolveStoreSalesChannels: (storeId: string) => Array<AppChannel | Record<string, unknown>>;
  channelName: AppChannelNameFn;
  handleOwnerCloseoutUpdated: (closeout: AppCloseoutRecord) => void | Promise<void>;
  handleOwnerCloseoutDeleted: (closeout: AppCloseoutRecord) => void | Promise<void>;
  setOwnerManageCloseout: (closeout: AppCloseoutRecord | null) => void;
  ownerEditCloseout: AppCloseoutRecord | null;
  setOwnerEditCloseout: (closeout: AppCloseoutRecord | null) => void;
  ownerCloseoutActor: Record<string, unknown>;
  ownerCloseoutAttachmentsApiProps: AppAttachmentsApiProps;
  helpOpen: boolean;
  setHelpOpen: (open: boolean) => void;
};

export type OwnerRegisterScreenProps = {
  lang: AppLang;
  onOpenOperation?: (entry: OperationalEntry) => void;
  onVoidOperation?: (entryId: string) => void;
  onRestoreOperation?: (entryId: string) => void;
  onEditCloseout?: (summary: RegisterCloseoutSummary) => void;
  onDeleteCloseout?: (summary: RegisterCloseoutSummary) => void;
  onShareRegister?: (snapshot: Record<string, unknown>) => void;
  operationalEntries?: OperationalEntry[];
  selectedBusiness?: string;
  setSelectedBusiness?: (value: string) => void;
  businessesList?: AppBusiness[];
  archivedBusinessIds?: string[];
  archivedReadOnlyBusinessId?: string | null;
  duplicateSummaryFocus?: Record<string, unknown> | null;
  notebookTheme?: NotebookThemeId | string;
  notebookPattern?: NotebookPatternId | string;
  registerEntriesApiEnabled?: boolean;
  closeoutsApiEnabled?: boolean;
  registerEntriesApiOrganizationId?: string;
  registerEntriesApiActorUserId?: string;
  registerEntriesApiActorRole?: string;
  registerEntriesSyncError?: string;
  entryAttachmentsApiEnabled?: boolean;
  entryAttachmentsApiOrganizationId?: string;
  entryAttachmentsApiActorUserId?: string;
  entryAttachmentsApiActorRole?: string;
  configuredChannels?: AppChannel[];
  resolveStoreSalesChannels?: (storeId: string) => Array<AppChannel | Record<string, unknown>>;
};

export type OwnerHomeProps = {
  lang: AppLang;
  operationalEntries?: OperationalEntry[];
  operationalEntriesLoading?: boolean;
  duplicateSalesAlerts?: Array<Record<string, unknown>>;
  closeoutAlerts?: Array<Record<string, unknown>>;
  onOpenCloseoutAlertInRegister?: (alert: Record<string, unknown>) => void;
  onDismissCloseout?: (alert: Record<string, unknown>) => void;
  onOpenDuplicateSummaryInRegister?: (alert: Record<string, unknown>) => void;
  onAcknowledgeDuplicate?: (key: string) => void;
  onOpenOperation?: (entry: OperationalEntry) => void;
  onShareNotebook?: (snapshot: Record<string, unknown>) => void;
  notebookTheme?: NotebookThemeId | string;
  notebookPattern?: NotebookPatternId | string;
  selectedBusiness?: string;
  setSelectedBusiness?: (value: string) => void;
  businessesList?: AppBusiness[];
  configuredChannels?: AppChannel[];
  summaryApiEnabled?: boolean;
  summaryApiOrganizationId?: string;
  summaryApiActorUserId?: string;
  summaryApiActorRole?: string;
  entryAttachmentsApiEnabled?: boolean;
  entryAttachmentsApiOrganizationId?: string;
  entryAttachmentsApiActorUserId?: string;
  entryAttachmentsApiActorRole?: string;
  ownerProfile?: Record<string, unknown> | null;
  onOpenSubscriptionSettings?: () => void;
};

export type UseOwnerSettingsScreenStateProps = OwnerSettingsScreenProps;

export type UseTaqfeelahAppOwnerSaveActionsProps = {
  lang: AppLang;
  savingRef: MutableRefObject<boolean>;
  setSaving: (value: boolean) => void;
  entriesApiDbSource: boolean;
  entriesApiEnabled: boolean;
  activeBusinessIds: string[];
  todayDate: string;
  createOperationalEntryInApi: (params: CreateOperationalEntryInApiParams) => Promise<unknown>;
  loadOperationalEntriesFromApi: AppReloadOperationalEntriesFn;
  ownerApiUserId: string;
  currentOwnerActor: AppOwnerActor;
  setLastCloseoutDates: AppSetState;
  setOwnerPage: (page: AppOwnerPage) => void;
  setSavedOutflowShareTarget: (entry: OperationalEntry | null) => void;
  setSaved: (value: boolean) => void;
  setOperationalEntries: AppSetState<OperationalEntry[]>;
  closeoutsApiEnabled?: boolean;
  closeoutsApiOrganizationId?: string;
  ownerCloseoutChannelConfig?: StoreChannelConfig;
  syncSubmitCloseoutToApi?: (params: Record<string, unknown>) => Promise<Record<string, unknown> | null>;
};

export type UseTaqfeelahAppOwnerCloseoutActionsProps = {
  lang: AppLang;
  entriesApiDbSource: boolean;
  runtimeApiStoresReady: boolean;
  activeViewBusiness: string;
  activeBusinesses: AppBusiness[];
  activeOwnerStoreId: string;
  storeChannelSettings: AppStoreChannelSettings;
  ownerApiUserId: string;
  currentOwnerActor: AppOwnerActor;
  ownerProfile: Record<string, unknown>;
  ownerDisplayName: string;
  setOwnerPage: (page: AppOwnerPage) => void;
  setQuickAddOpen: (open: boolean) => void;
  openQuickAddSummary: () => void;
  openQuickAddExpense: () => void;
  loadOperationalEntriesFromApi: AppReloadOperationalEntriesFn;
  removeOperationalEntriesForCloseout: (closeoutId: string, storeId?: string) => void;
  syncCloseoutToOperationalEntries: TaqfeelahAppCallback;
  setCloseoutAlerts: AppSetState<Array<Record<string, unknown>>>;
  setOwnerManageCloseout: AppSetState<AppCloseoutRecord | null>;
};

export type RegisterViewItem = SettingsTabItem;

export type RegisterListBaseProps = {
  lang: DisplayLang;
  logFilters: RegisterLogFilters;
  showStoreBadge?: boolean;
  entryAttachmentApiContext?: EntryAttachmentApiContext;
  archivedBusinessIds?: string[];
  onOpenOperation: (item: OperationalEntry) => void;
  onVoidOperation?: (entryId: string) => void;
  onRestoreOperation?: (entryId: string) => void;
};
