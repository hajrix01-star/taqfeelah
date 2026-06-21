import type { OperationalEntry, OperationalEntryActor, OperationalEntryPayload } from "@/features/entries/client/entries-client-types";
import type { CloseoutAlertRecord } from "@/features/operations/operations-types";

export type OwnerShellApplyHandlers = {
  setArchivedReadOnlyBusinessId?: (value: string | null) => void;
  setDuplicateSummaryFocus?: (value: unknown) => void;
  setSelectedBusiness?: (value: string) => void;
  setOwnerPage?: (value: string) => void;
  setQuickAddOpen?: (value: boolean) => void;
  setSelected?: (value: OperationalEntry | null) => void;
  setCloseoutAlerts?: (updater: (current: CloseoutAlertItem[]) => CloseoutAlertItem[]) => void;
};

export type CloseoutAlertItem = CloseoutAlertRecord & {
  seen?: boolean;
};

export type OwnerShellPreferences = {
  closeoutAlerts?: CloseoutAlertItem[];
  acknowledgedDuplicateSales?: Record<string, string>;
};

export type UseOwnerShellStateProps = {
  bindsToServerAuth: boolean;
  ownerShellPreferences?: OwnerShellPreferences;
  onOwnerShellPreferencesChange?: ((value: OwnerShellPreferences) => void) | null;
  operationalEntries?: OperationalEntry[];
  activeBusinesses?: Array<{ id?: string }>;
  configuredBusinesses?: Array<{ id?: string }>;
  storeOperationalSettings?: Record<string, unknown>;
  closeoutAlertEnabledForBusiness?: (businessId: string | undefined) => boolean;
  setSelected?: (value: OperationalEntry | null) => void;
};

export type OwnerShellNotificationInput = {
  unseenCloseoutAlerts: CloseoutAlertItem[];
  apply: OwnerShellApplyHandlers;
};

export type PushCloseoutAlertFn = (
  payload: OperationalEntryPayload,
  entry: OperationalEntry,
  actor: OperationalEntryActor,
) => void;
