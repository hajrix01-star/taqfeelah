import type { Dispatch, MutableRefObject, ReactNode, RefObject, SetStateAction } from "react";
import type { LucideIcon } from "lucide-react";
import type { DisplayLang } from "@/core/i18n/display-locale";
import type { NotebookThemeId } from "@/features/daily-closeouts/daily-closeouts-types";
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
import type { TeamInvitation } from "@/features/member-invitations/client/member-invitations-client-types";
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
import type { StoreOperationalSettings } from "@/domain/store-operational-settings/types";

export type { DisplayLang, OperationalEntry, OperationalEntryActor, OperationalEntryPayload, NotebookThemeId, RegisterLogFilters };

export type PrototypeOperationalEntry = OperationalEntry & {
  closeoutOwnerEditedByUserId?: string;
  closeoutOwnerEditedByName?: string;
};

export type PrototypeAttachmentPreviewState = {
  src: string;
  shareContext?: Record<string, unknown> | null;
} | null;

export type PrototypePendingDuplicateSummary = (NonNullable<PendingDuplicateSummary> & {
  previousEntries?: OperationalEntry[];
}) | null;

export type PrototypeLang = DisplayLang;

export type PrototypeAuthScreen = "gateway" | "owner" | "employee" | (string & {});

export type PrototypeOwnerPage =
  | "home"
  | "register"
  | "closeouts"
  | "notebook"
  | "settings"
  | (string & {});

export type PrototypeEmployeePage = "home" | "entries" | "settings" | (string & {});

export type PrototypeStoreRecord = {
  sales: number;
  expense: number;
  ratio: string;
  net: number;
  proofs: number;
};

export type PrototypeBusiness = {
  id: string;
  nameKey?: string;
  nameAr?: string;
  nameEn?: string;
  shortKey?: string;
  locationKey?: string;
  displayName?: string;
  customLocation?: string;
  day?: PrototypeStoreRecord;
  month?: PrototypeStoreRecord;
  [key: string]: unknown;
};

export type PrototypeStaffMember = {
  id?: string;
  nameAr?: string;
  nameEn?: string;
  active?: boolean;
  storeIds?: string[];
  pin?: string;
  [key: string]: unknown;
};

export type PrototypeOwnerActor = OperationalEntryActor & {
  role?: string;
  userId?: string;
  nameAr?: string;
  nameEn?: string;
};

export type PrototypeChannel = {
  id: string;
  text?: string;
  kind?: string;
  icon?: unknown;
  amount?: number;
  [key: string]: unknown;
};

export type PrototypeExpenseCategory = {
  id: string;
  label: string;
  amount?: number;
};

export type PrototypeOutflowCategory = PrototypeExpenseCategory & {
  amount?: number;
};

export type PrototypeTextFn = (lang: PrototypeLang, key: string) => string;

export type PrototypeMoneyFn = (value: number, lang: PrototypeLang) => string;

export type PrototypeChannelNameFn = (
  channel: PrototypeChannel | Record<string, unknown>,
  lang: PrototypeLang,
) => string;

export type PrototypeFormatCalendarDateFn = (
  date: string,
  lang: PrototypeLang,
) => string;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type PrototypeRuntimeCallback = (...args: any[]) => any;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type PrototypeSetState<T = any> = Dispatch<SetStateAction<T>>;

export type PrototypeRef<T> = MutableRefObject<T | null>;

export type PrototypeAttachmentsApiProps = {
  attachmentsApiEnabled?: boolean;
  attachmentsApiOrganizationId?: string;
  attachmentsApiActorUserId?: string;
  attachmentsApiActorRole?: string;
};

export type PrototypeEntryAttachmentsApiProps = {
  entryAttachmentsApiEnabled?: boolean;
  entryAttachmentsApiOrganizationId?: string;
  entryAttachmentsApiActorUserId?: string;
  entryAttachmentsApiActorRole?: string;
};

export type PrototypeLangProps = {
  lang: PrototypeLang;
};

export type PrototypeNotebookThemeProps = {
  notebookTheme?: NotebookThemeId | string;
};

export type PrototypeOperationalEntryList = OperationalEntry[];

export type PrototypeCloseoutRecord = CloseoutRecord;

export type PrototypeStoreChannelSettings = Record<string, StoreChannelConfig>;

export type PrototypeStoreOperationalSettings = Record<string, StoreOperationalSettings>;

export type PrototypeVoidRestoreTarget = OperationalEntry | null;

export type PrototypeShareSnapshot = Record<string, unknown> | null;

export type PrototypeSavedOutflowShareTarget = OperationalEntry | null;

export type PrototypeSelectedOperation = OperationalEntry | null;

export type PrototypeReloadOperationalEntriesFn = LoadOperationalEntriesFn;

export type PrototypeChildrenProps = {
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
  onConfirm: () => void;
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
  showSummaryDetails?: boolean;
  showDetails?: boolean;
  showOutflowTransactions?: boolean;
  reportChannels?: PrototypeChannel[];
  summaryBusinessRows?: Array<Record<string, unknown>>;
  summaryRecord?: PrototypeStoreRecord;
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
  business: PrototypeBusiness;
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
  record: PrototypeStoreRecord;
  netMarginRatio: string;
  title: string;
  periodLabel: string;
  outflowCategoryLabel: string;
  activeTheme: NotebookThemeStyle;
  lines: { backgroundImage: string };
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
  businessesList: PrototypeBusiness[];
  operationalEntries: OperationalEntry[];
  archivedBusinessIds: string[];
  apiEntries?: OperationalEntry[] | null;
  apiRecord?: PrototypeStoreRecord | null;
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
  error?: string;
  loading?: boolean;
  hydrated?: boolean;
  reload?: () => void | Promise<void>;
  flushPersist?: (
    overrides?: Partial<OrgConfigRuntimeSnapshot>,
    options?: { employeePins?: Record<string, string> },
  ) => void | Promise<void>;
} | null;

export type OwnerSettingsScreenProps = {
  lang: DisplayLang;
  notebookTheme: NotebookThemeId | string;
  setNotebookTheme: (value: NotebookThemeId | string) => void;
  employeePreferences?: Record<string, unknown>;
  ownerShellPreferences?: Record<string, unknown>;
  storeChannelSettings: Record<string, StoreChannelConfig>;
  setStoreChannelSettings: (value: Record<string, StoreChannelConfig>) => void;
  storeOperationalSettings: Record<string, StoreOperationalSettings>;
  setStoreOperationalSettings: (value: Record<string, StoreOperationalSettings>) => void;
  configuredBusinesses: PrototypeBusiness[];
  setConfiguredBusinesses: (value: PrototypeBusiness[]) => void;
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
  selectedStore: PrototypeBusiness;
  displayBusinessName: (business: PrototypeBusiness) => string;
  displayLocation: (business: PrototypeBusiness) => string;
  archived: boolean;
  operationalConfig: StoreOperationalSettings;
  draftStoreName: string;
  setDraftStoreName: (value: string) => void;
  draftStoreLocation: string;
  setDraftStoreLocation: (value: string) => void;
  saveStoreProfile: () => void;
  channelConfig: StoreChannelConfig;
  retiredChannels: PrototypeChannel[];
  newCustomIncomeSourceName: string;
  setNewCustomIncomeSourceName: (value: string) => void;
  toggleChannel: (channelId: string) => void;
  requestRetireChannel: (channel: PrototypeChannel | Record<string, unknown> | string) => void;
  restoreSalesChannel: (channel: PrototypeChannel | Record<string, unknown> | string) => void;
  addCustomIncomeSource: () => void;
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
  requestArchiveStore: (store?: PrototypeBusiness) => void;
  openStoreDelete: (store: PrototypeBusiness) => void;
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- hook bundle state
export type OwnerSettingsTabbedShellState = Record<string, any> & {
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
  lang: PrototypeLang;
  ownerManageCloseout: DailyCloseoutRecord | null;
  ownerDisplayName?: string;
  ownerNotebookTheme?: NotebookThemeId | string;
  resolveSalesChannels?: (storeId: string) => PrototypeChannel[];
  channelLabel?: (channel: PrototypeChannel | Record<string, unknown>) => string;
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
  lang: PrototypeLang;
  editCloseout: DailyCloseoutRecord | null;
  ownerActor: PrototypeOwnerActor | Record<string, unknown>;
  ownerNotebookTheme?: NotebookThemeId | string;
  resolveSalesChannels?: (storeId: string) => PrototypeChannel[];
  channelLabel?: (channel: PrototypeChannel | Record<string, unknown>) => string;
  onCloseoutUpdated?: (closeout: DailyCloseoutRecord) => void | Promise<void>;
  onClose: () => void;
};

export type NotebookShareModalProps = {
  lang: PrototypeLang;
  snapshot: NotebookShareSnapshot | null;
  onClose: () => void;
  businessesList?: PrototypeBusiness[];
  operationalEntries?: OperationalEntry[];
  archivedBusinessIds?: string[];
  notebookExportApiEnabled?: boolean;
  notebookExportAuth?: Record<string, unknown>;
  allowedFormats?: string[];
};

export type OwnerNotebookShareModalProps = {
  lang: PrototypeLang;
  note: OwnerNotebookNote | null;
  onClose: () => void;
};

export type EmployeeSettingsScreenProps = {
  lang: PrototypeLang;
  onBack: () => void;
  currentStore: PrototypeBusiness | null;
  assignedStores: PrototypeBusiness[];
  onSelectStore: (storeId: string) => void;
  employeeNotebookTheme: NotebookThemeId | string;
  setEmployeeNotebookTheme: (theme: NotebookThemeId | string) => void;
  onOpenSupport: () => void;
  onOpenHelp: () => void;
};

export type OwnerNotebookScreenProps = {
  lang: PrototypeLang;
  notebookTheme?: NotebookThemeId | string;
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- hook bundle state
export type OwnerSettingsViewState = Record<string, any> & {
  lang: DisplayLang;
  deleteDialogProps: OwnerSettingsDeleteDialogProps;
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
  retiredChannels: PrototypeChannel[];
  newCustomIncomeSourceName: string;
  setNewCustomIncomeSourceName: (value: string) => void;
  toggleChannel: (channelId: string) => void;
  requestRetireChannel: (channel: PrototypeChannel | Record<string, unknown> | string) => void;
  restoreSalesChannel: (channel: PrototypeChannel | Record<string, unknown> | string) => void;
  addCustomIncomeSource: () => void;
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
  selectedStore: PrototypeBusiness;
  displayBusinessName: (business: PrototypeBusiness) => string;
  displayLocation: (business: PrototypeBusiness) => string;
  archived: boolean;
  activeChannelCount: number;
  activeCategoryCount: number;
  operationalConfig: StoreOperationalSettings;
  openStorePanel: (panel: string) => void;
  setArchivedReadOnlyBusinessId: (value: string | null) => void;
  setSelectedBusiness: (value: string) => void;
  setOwnerPage: (value: string) => void;
  toggleArchive: (storeId: string) => void;
  requestArchiveStore: (store?: PrototypeBusiness) => void;
  openStoreDelete: (store: PrototypeBusiness) => void;
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- screen handler bundle from hook state
export type OwnerSettingsScreenHandlersContext = any;

export type OwnerSettingsIncomeSourcesEditorProps = {
  lang: DisplayLang;
  channelConfig: StoreChannelConfig;
  retiredChannels: PrototypeChannel[];
  newCustomIncomeSourceName: string;
  setNewCustomIncomeSourceName: (value: string) => void;
  toggleChannel: (channelId: string) => void;
  requestRetireChannel: (channel: PrototypeChannel | Record<string, unknown> | string) => void;
  restoreSalesChannel: (channel: PrototypeChannel | Record<string, unknown> | string) => void;
  addCustomIncomeSource: () => void;
  text: (lang: DisplayLang, key: string) => string;
  channelName: (channel: PrototypeChannel | Record<string, unknown>, lang: DisplayLang) => string;
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
  activeStoredBusinesses: PrototypeBusiness[];
  displayBusinessName: (business: PrototypeBusiness) => string;
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
  groupedInvites?: {
    usedInvitesByUserId?: Map<string, Record<string, unknown>> | null;
  } | null;
};

export type OwnerSettingsPendingInvite = Record<string, unknown> & {
  invitationId: string;
  displayName?: string;
  status?: string;
  phoneNumber?: string;
  storeName?: string;
};

export type OwnerSettingsTeamInviteForm = {
  displayName: string;
  phoneNumber: string;
  pin: string;
  storeId: string;
  role: string;
  canCreate: boolean;
  creating: boolean;
  copiedField: string | null;
  error: string | null;
  createdInvite: TeamInvitation | null;
  setDisplayName: (value: string) => void;
  setPhoneNumber: (value: string) => void;
  setPin: (value: string) => void;
  setStoreId: (value: string) => void;
  setRole: (value: string) => void;
  createInvite: () => void | Promise<void>;
  copyText: (value: string, field: string) => void | Promise<void>;
  shareInviteWhatsApp: (invite: TeamInvitation) => void;
  revokeInvite: (invitationId: string) => void | Promise<void>;
};

export type OwnerSettingsTeamInviteCreateProps = {
  lang: DisplayLang;
  activeStoredBusinesses: PrototypeBusiness[];
  displayBusinessName: (business: PrototypeBusiness) => string;
  invites: OwnerSettingsTeamInviteForm;
};

export type OwnerSettingsTeamPendingInvitesProps = {
  lang: DisplayLang;
  pendingInvites: OwnerSettingsPendingInvite[];
  loading: boolean;
  onRevokeInvite: (invitationId: string) => void | Promise<void>;
};

export type OwnerSettingsTeamSectionWithInvitesProps = {
  inviteApiContext: NonNullable<OwnerSettingsApiContext> & {
    organizationId?: string;
    actorUserId?: string;
    actorRole?: string;
  };
  lang: DisplayLang;
  activeStoredBusinesses: PrototypeBusiness[];
  displayBusinessName: (business: PrototypeBusiness) => string;
  rosterProps: OwnerSettingsTeamRosterProps;
};

export type OwnerSettingsStaffInviteLineProps = {
  lang: DisplayLang;
  invite: Record<string, unknown> | null;
};

export type RegisterUiProps = {
  lang: DisplayLang;
};

export type PrototypeRuntimePageContentProps = {
  lang: PrototypeLang;
  text: PrototypeTextFn;
  channelName: PrototypeChannelNameFn;
  formatCalendarDate: PrototypeFormatCalendarDateFn;
  employee: boolean;
  employeePage: PrototypeEmployeePage;
  activeEmployee: PrototypeStaffMember | null;
  sessionDisplayName?: string;
  employeeRuntimeReady: boolean;
  currentEmployeeBusiness: PrototypeBusiness | null;
  assignedEmployeeBusinesses: PrototypeBusiness[];
  setEmployeeBusinessId: (id: string) => void;
  currentEmployeeChannelConfig: StoreChannelConfig;
  employeeNotebookTheme: NotebookThemeId | string;
  employeeThemeOverride: NotebookThemeId | string | null;
  currentEmployeeOperationalConfig: StoreOperationalSettings;
  handleEmployeeNotebookThemeSave: (theme: NotebookThemeId | string) => void;
  setHelpOpen: (open: boolean) => void;
  setEmployeeEntryActive: (active: boolean) => void;
  employeeAddHandlerRef: PrototypeRef<() => void>;
  employeeSettingsOpenerRef: PrototypeRef<() => void>;
  saving: boolean;
  closeoutsApiDbSource: boolean;
  closeoutAttachmentsApiProps: PrototypeAttachmentsApiProps;
  ownerPage: PrototypeOwnerPage;
  ownerCloseoutActor: Record<string, unknown>;
  runtimeApiStoresReady: boolean;
  ownerCloseoutBusiness: PrototypeBusiness | null;
  activeBusinesses: Array<PrototypeBusiness | Record<string, unknown>>;
  setSelectedBusiness: (value: string) => void;
  ownerCloseoutChannelConfig: StoreChannelConfig;
  notebookTheme: NotebookThemeId | string;
  setOwnerEntryActive: (active: boolean) => void;
  ownerAddHandlerRef: PrototypeRef<() => void>;
  setOwnerPage: (page: PrototypeOwnerPage) => void;
  entriesApiDbSource: boolean;
  operationalEntries: OperationalEntry[];
  operationalEntriesLoading: boolean;
  duplicateSalesAlerts: Array<Record<string, unknown>> | unknown[];
  unseenCloseoutAlerts: Array<Record<string, unknown>> | unknown[];
  openCloseoutAlertInRegister: PrototypeRuntimeCallback;
  dismissCloseoutAlert: PrototypeRuntimeCallback;
  openDuplicateSummaryInRegister: PrototypeRuntimeCallback;
  acknowledgeDuplicateSales: PrototypeRuntimeCallback;
  handleOpenOwnerOperation: PrototypeRuntimeCallback;
  requestVoidOperation: PrototypeRuntimeCallback;
  requestRestoreOperation: PrototypeRuntimeCallback;
  setOwnerEditCloseout: (closeout: PrototypeCloseoutRecord | null) => void;
  handleOwnerCloseoutDeleted: (closeout: PrototypeCloseoutRecord) => void | Promise<void>;
  setShareSnapshot: PrototypeSetState<PrototypeShareSnapshot>;
  activeViewBusiness: string;
  homeReportChannelConfig: StoreChannelConfig;
  entriesApiEnabled: boolean;
  closeoutsApiEnabled?: boolean;
  closeoutsApiOrganizationId: string | null;
  ownerApiUserId: string | null;
  ownerNotebookApiEnabled?: boolean;
  entryAttachmentsApiProps: PrototypeEntryAttachmentsApiProps;
  saveOwnerSummary: (payload: OperationalEntryPayload) => Promise<void>;
  saveOwner: (payload: OperationalEntryPayload) => Promise<void>;
  storeChannelSettings: PrototypeStoreChannelSettings;
  storeOperationalSettings: PrototypeStoreOperationalSettings;
  duplicateSummaryFocus: Record<string, unknown> | null | unknown;
  archivedReadOnlyBusinessId: string | null;
  selectedBusiness: string;
  reportingBusinesses: Array<PrototypeBusiness | Record<string, unknown>>;
  archivedBusinessIds: string[];
  registerEntriesPaginationEnabled: boolean;
  resolveStoreSalesChannels: (storeId: string) => Array<PrototypeChannel | Record<string, unknown>>;
  configuredBusinesses: Array<PrototypeBusiness | Record<string, unknown>>;
  setConfiguredBusinesses: PrototypeSetState<Array<PrototypeBusiness | Record<string, unknown>>>;
  setArchivedBusinessIds: PrototypeSetState<string[]>;
  staff: Array<PrototypeStaffMember | OrgStaffMember | Record<string, unknown>>;
  setStaff: PrototypeSetState<Array<PrototypeStaffMember | OrgStaffMember | Record<string, unknown>>>;
  ownerProfile: Record<string, unknown>;
  setOwnerProfile: PrototypeSetState<Record<string, unknown>>;
  authOwnerUsername: string;
  setAuthOwnerUsername: (value: string) => void;
  authOwnerPassword: string;
  setAuthOwnerPassword: (value: string) => void;
  authEmployeePins: Record<string, string>;
  setAuthEmployeePins: PrototypeSetState<Record<string, string>>;
  employeePreferences: Record<string, unknown>;
  ownerShellPreferences: Record<string, unknown>;
  setNotebookTheme: (theme: NotebookThemeId | string) => void;
  setStoreChannelSettings: PrototypeSetState<PrototypeStoreChannelSettings>;
  setStoreOperationalSettings: PrototypeSetState<PrototypeStoreOperationalSettings>;
  setArchivedReadOnlyBusinessId: (value: string | null) => void;
  setLastCloseoutDates: PrototypeSetState;
  persistRuntimeSettingsNow: PrototypeRuntimeCallback;
  reloadOrgConfig: PrototypeRuntimeCallback;
  flushOrgConfigPersist: PrototypeRuntimeCallback;
  orgConfigLoading?: boolean;
  orgConfigHydrated?: boolean;
  logout: () => void;
  saved: boolean;
};

export type PrototypeRuntimeOverlayStackProps = {
  lang: PrototypeLang;
  employee: boolean;
  employeePage: PrototypeEmployeePage;
  ownerPage: PrototypeOwnerPage;
  employeeEntryActive: boolean;
  ownerEntryActive: boolean;
  employeeAddHandlerRef: PrototypeRef<() => void>;
  handleOwnerQuickAddOpen: () => void;
  changeEmployeePage: (page: PrototypeEmployeePage) => void;
  changeOwnerPage: (page: PrototypeOwnerPage) => void;
  setQuickAddOpen: (open: boolean) => void;
  quickAddOpen: boolean;
  handleOpenQuickAddSummary: () => void;
  handleOpenQuickAddExpense: () => void;
  selected: PrototypeSelectedOperation;
  setSelected: PrototypeSetState;
  requestVoidOperation: PrototypeRuntimeCallback;
  requestRestoreOperation: PrototypeRuntimeCallback;
  archivedBusinessIds: string[];
  entryAttachmentsApiProps: PrototypeEntryAttachmentsApiProps;
  pendingDuplicateSummary: PrototypePendingDuplicateSummary;
  setPendingDuplicateSummary: PrototypeSetState;
  activeBusinesses: Array<PrototypeBusiness | Record<string, unknown>>;
  confirmDuplicateSummary: () => void | Promise<void>;
  voidTarget: PrototypeVoidRestoreTarget;
  setVoidTarget: PrototypeSetState;
  confirmVoidOperation: () => void | Promise<void>;
  restoreTarget: PrototypeVoidRestoreTarget;
  setRestoreTarget: PrototypeSetState;
  confirmRestoreOperation: () => void | Promise<void>;
  savedOutflowShareTarget: PrototypeSavedOutflowShareTarget;
  setSavedOutflowShareTarget: PrototypeSetState;
  shareSnapshot: PrototypeShareSnapshot | unknown;
  setShareSnapshot: PrototypeSetState<PrototypeShareSnapshot>;
  reportingBusinesses: Array<PrototypeBusiness | Record<string, unknown>>;
  operationalEntries: OperationalEntry[];
  phase9ApiEnabled: boolean;
  entriesApiEnabled: boolean;
  closeoutsApiEnabled?: boolean;
  runtimeApiAuth: Record<string, unknown>;
  ownerManageCloseout: PrototypeCloseoutRecord | null;
  ownerDisplayName: string;
  notebookTheme: NotebookThemeId | string;
  resolveStoreSalesChannels: (storeId: string) => Array<PrototypeChannel | Record<string, unknown>>;
  channelName: PrototypeChannelNameFn;
  handleOwnerCloseoutUpdated: (closeout: PrototypeCloseoutRecord) => void | Promise<void>;
  handleOwnerCloseoutDeleted: (closeout: PrototypeCloseoutRecord) => void | Promise<void>;
  setOwnerManageCloseout: (closeout: PrototypeCloseoutRecord | null) => void;
  ownerEditCloseout: PrototypeCloseoutRecord | null;
  setOwnerEditCloseout: (closeout: PrototypeCloseoutRecord | null) => void;
  ownerCloseoutActor: Record<string, unknown>;
  ownerCloseoutAttachmentsApiProps: PrototypeAttachmentsApiProps;
  helpOpen: boolean;
  setHelpOpen: (open: boolean) => void;
};

export type OwnerRegisterScreenProps = {
  lang: PrototypeLang;
  onOpenOperation?: (entry: OperationalEntry) => void;
  onVoidOperation?: (entryId: string) => void;
  onRestoreOperation?: (entryId: string) => void;
  onEditCloseout?: (summary: RegisterCloseoutSummary) => void;
  onDeleteCloseout?: (summary: RegisterCloseoutSummary) => void;
  onShareRegister?: (snapshot: Record<string, unknown>) => void;
  operationalEntries?: OperationalEntry[];
  selectedBusiness?: string;
  setSelectedBusiness?: (value: string) => void;
  businessesList?: PrototypeBusiness[];
  archivedBusinessIds?: string[];
  archivedReadOnlyBusinessId?: string | null;
  duplicateSummaryFocus?: Record<string, unknown> | null;
  notebookTheme?: NotebookThemeId | string;
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
  configuredChannels?: PrototypeChannel[];
  resolveStoreSalesChannels?: (storeId: string) => Array<PrototypeChannel | Record<string, unknown>>;
};

export type OwnerHomeProps = {
  lang: PrototypeLang;
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
  selectedBusiness?: string;
  setSelectedBusiness?: (value: string) => void;
  businessesList?: PrototypeBusiness[];
  configuredChannels?: PrototypeChannel[];
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

export type UsePrototypeRuntimeOwnerSaveActionsProps = {
  lang: PrototypeLang;
  savingRef: MutableRefObject<boolean>;
  setSaving: (value: boolean) => void;
  entriesApiDbSource: boolean;
  entriesApiEnabled: boolean;
  activeBusinessIds: string[];
  todayDate: string;
  createOperationalEntryInApi: (params: CreateOperationalEntryInApiParams) => Promise<unknown>;
  loadOperationalEntriesFromApi: PrototypeReloadOperationalEntriesFn;
  ownerApiUserId: string;
  currentOwnerActor: PrototypeOwnerActor;
  setLastCloseoutDates: PrototypeSetState;
  setOwnerPage: (page: PrototypeOwnerPage) => void;
  setSavedOutflowShareTarget: (entry: OperationalEntry | null) => void;
  setSaved: (value: boolean) => void;
  setOperationalEntries: PrototypeSetState<OperationalEntry[]>;
  closeoutsApiEnabled?: boolean;
  closeoutsApiOrganizationId?: string;
  ownerCloseoutChannelConfig?: StoreChannelConfig;
  syncSubmitCloseoutToApi?: (params: Record<string, unknown>) => Promise<Record<string, unknown> | null>;
};

export type UsePrototypeRuntimeOwnerCloseoutActionsProps = {
  lang: PrototypeLang;
  entriesApiDbSource: boolean;
  runtimeApiStoresReady: boolean;
  activeViewBusiness: string;
  activeBusinesses: PrototypeBusiness[];
  activeOwnerStoreId: string;
  storeChannelSettings: PrototypeStoreChannelSettings;
  ownerApiUserId: string;
  currentOwnerActor: PrototypeOwnerActor;
  ownerProfile: Record<string, unknown>;
  ownerDisplayName: string;
  setOwnerPage: (page: PrototypeOwnerPage) => void;
  setQuickAddOpen: (open: boolean) => void;
  openQuickAddSummary: () => void;
  openQuickAddExpense: () => void;
  loadOperationalEntriesFromApi: PrototypeReloadOperationalEntriesFn;
  removeOperationalEntriesForCloseout: (closeoutId: string, storeId?: string) => void;
  syncCloseoutToOperationalEntries: PrototypeRuntimeCallback;
  setCloseoutAlerts: PrototypeSetState<Array<Record<string, unknown>>>;
  setOwnerManageCloseout: PrototypeSetState<PrototypeCloseoutRecord | null>;
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
