export type OrgConfigApiAuth = {
  organizationId: string;
  actorUserId: string;
  actorRole: string;
};

export type StoreChannelConfig = {
  channels: Array<Record<string, unknown>>;
  activeIds: string[];
};

export type OrgConfigRuntimeSnapshot = {
  configuredBusinesses: Array<Record<string, unknown>>;
  archivedBusinessIds: string[];
  storeChannelSettings: Record<string, StoreChannelConfig>;
  storeOperationalSettings?: Record<string, unknown>;
  staff: Array<Record<string, unknown>>;
};

export type OrgConfigRuntimeMapped = Partial<OrgConfigRuntimeSnapshot>;

export type OrgConfigRuntimeSetters = {
  setConfiguredBusinesses: (value: Array<Record<string, unknown>>) => void;
  setArchivedBusinessIds: (value: string[]) => void;
  setStoreChannelSettings: (value: Record<string, StoreChannelConfig>) => void;
  setStoreOperationalSettings: (value: Record<string, unknown>) => void;
  setStaff: (value: Array<Record<string, unknown>>) => void;
};

export type ApiStoreRow = Record<string, unknown> & {
  id?: string;
  legacyId?: string;
  name?: string;
  location?: string;
  status?: string;
  operationalSettings?: Record<string, unknown>;
};

export type ApiChannelRow = Record<string, unknown> & {
  id?: string;
  legacyId?: string;
  name?: string;
  kind?: string;
  status?: string;
};

export type ApiMemberRow = Record<string, unknown> & {
  userId?: string;
  memberId?: string;
  legacyStaffId?: string;
  name?: string;
  role?: string;
  status?: string;
  loginPhone?: string;
  mobile?: string;
  pinConfigured?: boolean;
  storeAccess?: Array<Record<string, unknown>>;
  storeIds?: string[];
};

export type OrgConfigBundleInput = {
  stores?: ApiStoreRow[];
  channelsByStoreId?: Record<string, ApiChannelRow[]>;
  members?: ApiMemberRow[];
  employeePins?: Record<string, string>;
};

export type StaffMember = Record<string, unknown> & {
  id: string;
  active?: boolean;
  removed?: boolean;
  storeIds?: string[];
  pin?: string;
  nameAr?: string;
  nameEn?: string;
  mobile?: string;
  memberId?: string;
};

export type StoreOperationalDraft = Record<string, unknown> & {
  activeCategories: string[];
};

export type StoreRecord = {
  sales: number;
  expense: number;
  ratio: string;
  net: number;
  proofs: number;
};

export type OwnerSettingsDeleteTarget = {
  type: "archive" | "store" | "channel" | "staff";
  item: Record<string, unknown> & { id: string };
  hasRecords?: boolean;
  affectedStaff?: Array<Record<string, unknown>>;
};

export function asApiPayload(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}
