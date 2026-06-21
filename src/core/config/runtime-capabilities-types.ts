export type RuntimeCapabilitiesEnv = {
  NODE_ENV?: string;
  NEXT_PUBLIC_APP_MODE?: string;
  NEXT_PUBLIC_CLOSEOUTS_API_ENABLED?: string;
  NEXT_PUBLIC_ENTRIES_API_ENABLED?: string;
  NEXT_PUBLIC_ORG_CONFIG_API_ENABLED?: string;
  NEXT_PUBLIC_PHASE9_API_ENABLED?: string;
  NEXT_PUBLIC_REGISTER_ENTRIES_PAGINATION_ENABLED?: string;
  NEXT_PUBLIC_DISABLE_BROWSER_PERSISTENCE?: string;
  NEXT_PUBLIC_CLOSEOUTS_API_ORGANIZATION_ID?: string;
  NEXT_PUBLIC_CLOSEOUTS_API_OWNER_USER_ID?: string;
};

export type RuntimeCapabilities = {
  appInProductionMode: boolean;
  prototypeAccessMode: boolean;
  bindsToServerAuth: boolean;
  closeoutsApiEnabled: boolean;
  closeoutsApiStrictMode: boolean;
  closeoutsApiDbSource: boolean;
  entriesApiEnabled: boolean;
  entriesApiStrictMode: boolean;
  entriesApiDbSource: boolean;
  orgConfigApiEnabled: boolean;
  phase9ApiEnabled: boolean;
  registerEntriesPaginationEnabled: boolean;
  runtimeSettingsDbSource: boolean;
  usesRuntimeSettingsApi: boolean;
  browserPersistentStorageAllowed: boolean;
};

export type RuntimeApiBusinessRef = {
  id?: string;
};

export type RuntimeApiActiveEmployee = {
  apiUserId?: string;
  id?: string;
  storeIds?: string[];
};

export type ResolveRuntimeApiActorContextInput = {
  employee?: boolean;
  sessionOrganizationId?: string;
  sessionUserId?: string;
  activeEmployee?: RuntimeApiActiveEmployee | null;
  assignedEmployeeBusinesses?: RuntimeApiBusinessRef[];
  operationalBusinesses?: RuntimeApiBusinessRef[];
  reportingBusinesses?: RuntimeApiBusinessRef[];
  readOnlyStoreIds?: string[];
  env?: RuntimeCapabilitiesEnv;
};

export type RuntimeApiActorContext = RuntimeCapabilities & {
  organizationId: string;
  ownerUserId: string;
  ownerApiUserId: string;
  apiActorRole: "owner" | "employee" | string;
  apiActorUserId: string;
  apiTargetStoreIdsKey: string;
};
