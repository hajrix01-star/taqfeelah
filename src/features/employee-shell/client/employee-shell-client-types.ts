import type { MutableRefObject } from "react";
import type { AuthStaffMember } from "@/features/auth/client/auth-client-types";
import type { DisplayLang } from "@/core/i18n/display-locale";
import type { StoreRef } from "@/features/daily-closeouts/daily-closeouts-types";
import type { StoreChannelConfig } from "@/features/org-config/client/org-config-client-types";
import type {
  OperationalEntry,
  OperationalEntryActor,
  OperationalEntryPayload,
  SetState,
} from "@/features/entries/client/entries-client-types";
import type { CloseoutAlertRecord } from "@/features/operations/operations-types";

export type EmployeeStoreChannelConfig = {
  channels: Array<Record<string, unknown>>;
  activeIds: string[];
};

export type EmployeePortalContextInput = {
  employee?: boolean;
  loggedInEmployeeId?: string;
  staff?: AuthStaffMember[];
  sessionUserId?: string;
  activeBusinesses?: StoreRef[];
  employeeBusinessId?: string;
  storeChannelSettings?: Record<string, StoreChannelConfig | undefined>;
  defaultStoreChannelConfig?: EmployeeStoreChannelConfig;
  storeOperationalSettings?: Record<string, unknown>;
  notebookTheme?: string;
  employeeThemeOverride?: string | null;
  expenseCategories?: Array<{ id: string }>;
  lastCloseoutDates?: Record<string, string>;
  todayDate?: string;
  nextDay?: (date: string) => string;
  uuidChecker?: (value: string) => boolean;
};

export type UseEmployeePortalStateProps = Omit<
  EmployeePortalContextInput,
  "employeeBusinessId" | "employeeThemeOverride"
> & {
  initialEmployeeBusinessId?: string;
  initialEmployeeThemeOverride?: string | null;
};

export type UseEmployeeEntryActionsProps = {
  lang: DisplayLang;
  text: (lang: DisplayLang, key: string) => string;
  savingRef: MutableRefObject<boolean>;
  setSaving: (value: boolean) => void;
  activeEmployee: AuthStaffMember | null;
  assignedEmployeeBusinessIds: string[];
  entriesApiEnabled?: boolean;
  entriesApiDbSource?: boolean;
  createOperationalEntryInApi: (args: {
    payload: OperationalEntryPayload;
    actorUserId: string;
    actorRole: string;
  }) => Promise<OperationalEntry | null>;
  loadOperationalEntriesFromApi: () => Promise<OperationalEntry[]>;
  buildEntry: (payload: OperationalEntryPayload, actor: OperationalEntryActor) => OperationalEntry;
  storeAttachmentPayload: (attachment: Record<string, unknown>) => Promise<void>;
  setOperationalEntries: SetState<OperationalEntry[]>;
  setLastCloseoutDates: SetState<Record<string, string>>;
  setCloseoutAlerts: SetState<CloseoutAlertRecord[]>;
  closeoutAlertEnabledForBusiness: (businessId: string | undefined) => boolean;
  setEmployeePage: (page: string) => void;
  setSaved: (value: boolean) => void;
  entryIsActive: (entry: OperationalEntry | null | undefined) => boolean;
  todayDate: string;
};
