import { resolveClientOrganizationId } from "@/core/client/resolve-client-organization-id";
import { isUuid } from "@/core/client/api-id-utils";
import { isProductionAppMode } from "@/core/config/app-mode";
import { isBrowserPersistentStorageAllowed } from "@/core/config/browser-persistence-policy";
import { isCloseoutsApiDbSourceMode, isCloseoutsApiEnabled, isCloseoutsApiStrictMode } from "@/core/config/closeouts-api-mode";
import { isEntriesApiDbSourceMode, isEntriesApiEnabled, isEntriesApiStrictMode } from "@/core/config/entries-api-mode";
import { isOrgConfigApiEnabled } from "@/core/config/org-config-api-mode";
import { isPhase9ApiEnabled } from "@/core/config/phase9-api-mode";
import { isRegisterEntriesPaginationEnabled } from "@/core/config/register-entries-pagination-mode";
import { readPublicEnvString } from "@/core/config/public-env";
import type {
  ResolveRuntimeApiActorContextInput,
  RuntimeApiActorContext,
  RuntimeCapabilities,
  RuntimeCapabilitiesEnv,
} from "@/core/config/runtime-capabilities-types";

export type {
  ResolveRuntimeApiActorContextInput,
  RuntimeApiActorContext,
  RuntimeCapabilities,
  RuntimeCapabilitiesEnv,
} from "@/core/config/runtime-capabilities-types";

function readRuntimeCapabilitiesEnv(): RuntimeCapabilitiesEnv {
  return {
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_APP_MODE: process.env.NEXT_PUBLIC_APP_MODE,
    NEXT_PUBLIC_CLOSEOUTS_API_ENABLED: process.env.NEXT_PUBLIC_CLOSEOUTS_API_ENABLED,
    NEXT_PUBLIC_ENTRIES_API_ENABLED: process.env.NEXT_PUBLIC_ENTRIES_API_ENABLED,
    NEXT_PUBLIC_ORG_CONFIG_API_ENABLED: process.env.NEXT_PUBLIC_ORG_CONFIG_API_ENABLED,
    NEXT_PUBLIC_PHASE9_API_ENABLED: process.env.NEXT_PUBLIC_PHASE9_API_ENABLED,
    NEXT_PUBLIC_REGISTER_ENTRIES_PAGINATION_ENABLED: process.env.NEXT_PUBLIC_REGISTER_ENTRIES_PAGINATION_ENABLED,
    NEXT_PUBLIC_DISABLE_BROWSER_PERSISTENCE: process.env.NEXT_PUBLIC_DISABLE_BROWSER_PERSISTENCE,
    NEXT_PUBLIC_CLOSEOUTS_API_ORGANIZATION_ID: process.env.NEXT_PUBLIC_CLOSEOUTS_API_ORGANIZATION_ID,
    NEXT_PUBLIC_CLOSEOUTS_API_OWNER_USER_ID: process.env.NEXT_PUBLIC_CLOSEOUTS_API_OWNER_USER_ID,
  };
}

export function resolveRuntimeCapabilities(
  env: RuntimeCapabilitiesEnv = readRuntimeCapabilitiesEnv(),
): RuntimeCapabilities {
  const appInProductionMode = isProductionAppMode();
  const bindsToServerAuth = appInProductionMode;
  const closeoutsApiEnabled = isCloseoutsApiEnabled(env);
  const entriesApiEnabled = isEntriesApiEnabled(env);
  const entriesApiDbSource = isEntriesApiDbSourceMode(env);

  // In production builds, prefer the org-config API as the authoritative
  // source of truth so the UI persists organization settings to the
  // server/database instead of falling back to local prototype storage.
  const orgConfigApiEnabled = appInProductionMode ? true : isOrgConfigApiEnabled(env);

  return {
    appInProductionMode,
    bindsToServerAuth,
    closeoutsApiEnabled,
    closeoutsApiStrictMode: isCloseoutsApiStrictMode(),
    closeoutsApiDbSource: isCloseoutsApiDbSourceMode(env),
    entriesApiEnabled,
    entriesApiStrictMode: isEntriesApiStrictMode(),
    entriesApiDbSource,
    orgConfigApiEnabled,
    phase9ApiEnabled: isPhase9ApiEnabled(env),
    registerEntriesPaginationEnabled: isRegisterEntriesPaginationEnabled(env),
    runtimeSettingsDbSource: entriesApiDbSource,
    usesRuntimeSettingsApi: bindsToServerAuth || entriesApiDbSource,
    browserPersistentStorageAllowed: isBrowserPersistentStorageAllowed({ env }),
  };
}

export function bindsToServerAuth() {
  return resolveRuntimeCapabilities().bindsToServerAuth;
}

export function usesRuntimeSettingsApi() {
  return resolveRuntimeCapabilities().usesRuntimeSettingsApi;
}

function readUuidEnvString(key: string, env: RuntimeCapabilitiesEnv = readRuntimeCapabilitiesEnv()): string {
  const value = readPublicEnvString(key, env);
  return isUuid(value) ? value : "";
}

export function appendStoreIdsToApiKey(
  apiTargetStoreIdsKey: string,
  extraStoreIds: string[] = [],
): string {
  const ids = apiTargetStoreIdsKey ? apiTargetStoreIdsKey.split("|").filter(Boolean) : [];
  for (const storeId of extraStoreIds) {
    const normalized = typeof storeId === "string" ? storeId.trim() : "";
    if (normalized && !ids.includes(normalized)) {
      ids.push(normalized);
    }
  }
  return ids.join("|");
}

export function resolveRuntimeApiActorContext({
  employee = false,
  sessionOrganizationId = "",
  sessionUserId = "",
  activeEmployee = null,
  assignedEmployeeBusinesses = [],
  operationalBusinesses = [],
  reportingBusinesses = [],
  readOnlyStoreIds = [],
  env = readRuntimeCapabilitiesEnv(),
}: ResolveRuntimeApiActorContextInput = {}): RuntimeApiActorContext {
  const capabilities = resolveRuntimeCapabilities(env);
  const organizationId = resolveClientOrganizationId({
    sessionOrganizationId,
    envOrganizationId: env.NEXT_PUBLIC_CLOSEOUTS_API_ORGANIZATION_ID || "",
  });
  const ownerUserId = readUuidEnvString("NEXT_PUBLIC_CLOSEOUTS_API_OWNER_USER_ID", env);
  const ownerApiUserId = employee ? ownerUserId : (sessionUserId || ownerUserId);
  const apiActorRole = employee ? "employee" : "owner";
  const apiActorUserId = employee
    ? (sessionUserId || activeEmployee?.apiUserId || activeEmployee?.id || "")
    : ownerApiUserId;
  const ownerSyncBusinesses = operationalBusinesses.length > 0
    ? operationalBusinesses
    : reportingBusinesses;
  const targetBusinesses = employee ? assignedEmployeeBusinesses : ownerSyncBusinesses;
  let apiTargetStoreIdsKey = targetBusinesses
    .map((store) => store.id)
    .filter(Boolean)
    .join("|");

  if (employee && !apiTargetStoreIdsKey) {
    apiTargetStoreIdsKey = (activeEmployee?.storeIds || [])
      .filter((storeId) => typeof storeId === "string" && storeId.trim())
      .join("|");
  }

  apiTargetStoreIdsKey = appendStoreIdsToApiKey(apiTargetStoreIdsKey, readOnlyStoreIds);

  return {
    ...capabilities,
    organizationId,
    ownerUserId,
    ownerApiUserId,
    apiActorRole,
    apiActorUserId,
    apiTargetStoreIdsKey,
  };
}
