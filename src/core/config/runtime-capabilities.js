import { isProductionAppMode } from "@/core/config/app-mode";
import { isBrowserPersistentStorageAllowed } from "@/core/config/browser-persistence-policy";
import { isCloseoutsApiDbSourceMode, isCloseoutsApiEnabled, isCloseoutsApiStrictMode } from "@/core/config/closeouts-api-mode";
import { isEntriesApiDbSourceMode, isEntriesApiEnabled, isEntriesApiStrictMode } from "@/core/config/entries-api-mode";
import { isOrgConfigApiEnabled } from "@/core/config/org-config-api-mode";
import { isPhase9ApiEnabled } from "@/core/config/phase9-api-mode";
import { isPrototypeAccessMode } from "@/core/config/prototype-access-mode";
import { isRegisterEntriesPaginationEnabled } from "@/core/config/register-entries-pagination-mode";

/**
 * @typedef {Object} RuntimeCapabilities
 * @property {boolean} appInProductionMode
 * @property {boolean} prototypeAccessMode
 * @property {boolean} bindsToServerAuth
 * @property {boolean} closeoutsApiEnabled
 * @property {boolean} closeoutsApiStrictMode
 * @property {boolean} closeoutsApiDbSource
 * @property {boolean} entriesApiEnabled
 * @property {boolean} entriesApiStrictMode
 * @property {boolean} entriesApiDbSource
 * @property {boolean} orgConfigApiEnabled
 * @property {boolean} phase9ApiEnabled
 * @property {boolean} registerEntriesPaginationEnabled
 * @property {boolean} runtimeSettingsDbSource
 * @property {boolean} usesRuntimeSettingsApi
 * @property {boolean} browserPersistentStorageAllowed
 */

function readRuntimeCapabilitiesEnv() {
  return {
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_APP_MODE: process.env.NEXT_PUBLIC_APP_MODE,
    NEXT_PUBLIC_PROTOTYPE_ACCESS_MODE: process.env.NEXT_PUBLIC_PROTOTYPE_ACCESS_MODE,
    NEXT_PUBLIC_CLOSEOUTS_API_ENABLED: process.env.NEXT_PUBLIC_CLOSEOUTS_API_ENABLED,
    NEXT_PUBLIC_ENTRIES_API_ENABLED: process.env.NEXT_PUBLIC_ENTRIES_API_ENABLED,
    NEXT_PUBLIC_ORG_CONFIG_API_ENABLED: process.env.NEXT_PUBLIC_ORG_CONFIG_API_ENABLED,
    NEXT_PUBLIC_PHASE9_API_ENABLED: process.env.NEXT_PUBLIC_PHASE9_API_ENABLED,
    NEXT_PUBLIC_REGISTER_ENTRIES_PAGINATION_ENABLED: process.env.NEXT_PUBLIC_REGISTER_ENTRIES_PAGINATION_ENABLED,
    NEXT_PUBLIC_DISABLE_BROWSER_PERSISTENCE: process.env.NEXT_PUBLIC_DISABLE_BROWSER_PERSISTENCE,
  };
}

/**
 * @param {Record<string, string | undefined>} [env]
 * @returns {RuntimeCapabilities}
 */
export function resolveRuntimeCapabilities(env = readRuntimeCapabilitiesEnv()) {
  const appInProductionMode = isProductionAppMode();
  const prototypeAccessMode = isPrototypeAccessMode();
  const bindsToServerAuth = appInProductionMode && !prototypeAccessMode;
  const closeoutsApiEnabled = isCloseoutsApiEnabled(env);
  const entriesApiEnabled = isEntriesApiEnabled(env);
  const entriesApiDbSource = isEntriesApiDbSourceMode(env);

  return {
    appInProductionMode,
    prototypeAccessMode,
    bindsToServerAuth,
    closeoutsApiEnabled,
    closeoutsApiStrictMode: isCloseoutsApiStrictMode(),
    closeoutsApiDbSource: isCloseoutsApiDbSourceMode(env),
    entriesApiEnabled,
    entriesApiStrictMode: isEntriesApiStrictMode(),
    entriesApiDbSource,
    orgConfigApiEnabled: isOrgConfigApiEnabled(env),
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

/**
 * @param {Object} input
 * @param {boolean} [input.employee]
 * @param {string} [input.sessionUserId]
 * @param {{ apiUserId?: string, id?: string, storeIds?: string[] } | null | undefined} [input.activeEmployee]
 * @param {Array<{ id?: string }>} [input.assignedEmployeeBusinesses]
 * @param {Array<{ id?: string }>} [input.reportingBusinesses]
 * @param {Record<string, string | undefined>} [input.env]
 */
export function resolveRuntimeApiActorContext({
  employee = false,
  sessionUserId = "",
  activeEmployee = null,
  assignedEmployeeBusinesses = [],
  reportingBusinesses = [],
  env = readRuntimeCapabilitiesEnv(),
} = {}) {
  const capabilities = resolveRuntimeCapabilities(env);
  const organizationId = env.NEXT_PUBLIC_CLOSEOUTS_API_ORGANIZATION_ID || "";
  const ownerUserId = env.NEXT_PUBLIC_CLOSEOUTS_API_OWNER_USER_ID || "";
  const ownerApiUserId = employee ? ownerUserId : (sessionUserId || ownerUserId);
  const apiActorRole = employee ? "employee" : "owner";
  const apiActorUserId = employee
    ? (sessionUserId || activeEmployee?.apiUserId || activeEmployee?.id || "")
    : ownerApiUserId;
  const targetBusinesses = employee ? assignedEmployeeBusinesses : reportingBusinesses;
  let apiTargetStoreIdsKey = targetBusinesses
    .map((store) => store.id)
    .filter(Boolean)
    .join("|");

  if (employee && !apiTargetStoreIdsKey) {
    apiTargetStoreIdsKey = (activeEmployee?.storeIds || [])
      .filter((storeId) => typeof storeId === "string" && storeId.trim())
      .join("|");
  }

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
