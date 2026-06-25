import type { OperationalInvalidationScope } from "@/core/client/invalidate-operational-data";
import {
  EMPLOYEE_OPERATIONAL_SYNC_PAGES,
  OWNER_OPERATIONAL_SYNC_PAGES,
} from "@/core/sync/operational-sync-policy";
import {
  OPERATIONAL_SYNC_BACKGROUND_REFRESH,
  type OperationalSyncRefreshTrigger,
} from "@/core/sync/operational-sync-event-types";

export type OperationalSyncRefreshTarget = {
  invalidateScopes: OperationalInvalidationScope[] | "all";
  reloadCloseouts: boolean;
  reloadEntries: boolean;
};

const CLOSEOUT_SCOPES: OperationalInvalidationScope[] = [
  "register",
  "closeouts",
  "reports",
  "summary",
  "homeAttachments",
  "duplicateWatch",
];

const ENTRY_SCOPES: OperationalInvalidationScope[] = [
  "register",
  "closeouts",
  "reports",
  "summary",
  "homeAttachments",
  "duplicateWatch",
];

export function resolveOperationalSyncRefreshTarget(
  eventType: OperationalSyncRefreshTrigger,
): OperationalSyncRefreshTarget {
  switch (eventType) {
    case OPERATIONAL_SYNC_BACKGROUND_REFRESH:
      return {
        invalidateScopes: CLOSEOUT_SCOPES,
        reloadCloseouts: true,
        reloadEntries: true,
      };
    case "closeout.submitted":
    case "closeout.deleted":
      return {
        invalidateScopes: CLOSEOUT_SCOPES,
        reloadCloseouts: true,
        reloadEntries: true,
      };
    case "entry.created":
    case "entry.voided":
    case "entry.restored":
      return {
        invalidateScopes: ENTRY_SCOPES,
        reloadCloseouts: false,
        reloadEntries: true,
      };
    default:
      return {
        invalidateScopes: "all",
        reloadCloseouts: true,
        reloadEntries: true,
      };
  }
}

export function shouldEnableOperationalSyncPolling(input: {
  employee: boolean;
  ownerPage: string;
  employeePage: string;
  ownerEntryActive: boolean;
  employeeEntryActive: boolean;
  syncEnabled: boolean;
}): boolean {
  if (!input.syncEnabled) return false;
  if (input.ownerEntryActive || input.employeeEntryActive) return false;
  if (!input.employee && input.ownerPage === "register") return false;
  if (input.employee) {
    return EMPLOYEE_OPERATIONAL_SYNC_PAGES.has(input.employeePage);
  }
  return OWNER_OPERATIONAL_SYNC_PAGES.has(input.ownerPage);
}

export function shouldEnableOperationalSyncFocusRefetch(input: {
  employee: boolean;
  ownerPage: string;
  employeePage: string;
  ownerEntryActive: boolean;
  employeeEntryActive: boolean;
  syncEnabled: boolean;
}): boolean {
  return shouldEnableOperationalSyncPolling(input);
}

export function shouldPauseOperationalSyncRefresh(input: {
  employee: boolean;
  ownerPage: string;
  employeePage: string;
  ownerEntryActive: boolean;
  employeeEntryActive: boolean;
  syncEnabled: boolean;
}): boolean {
  if (!input.syncEnabled) return true;
  if (input.ownerEntryActive || input.employeeEntryActive) return true;
  return !input.employee && input.ownerPage === "register";
}
