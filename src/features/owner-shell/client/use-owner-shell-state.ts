"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getStoreOperationalConfig } from "@/features/org-config/client/store-operational-config";
import { upsertCloseoutAlert, buildCloseoutAlertRecord } from "@/features/operations/operational-entry-save-helpers";
import type { OperationalEntry } from "@/features/entries/client/entries-client-types";
import {
  buildDuplicateSalesAlerts,
  buildOwnerNotificationState,
  resolveActiveViewBusiness,
} from "./owner-shell-notifications";
import {
  dismissCloseoutAlertRecord,
  handleOwnerNotificationsClick,
  navigateOwnerPage,
  openOwnerQuickExpense,
  openOwnerQuickSummary,
  resetOwnerNavContext,
  openCloseoutAlertInRegister,
  openDuplicateSummaryInRegister,
} from "./owner-shell-navigation";
import {
  readAcknowledgedDuplicateSales,
  readCloseoutAlerts,
  writeAcknowledgedDuplicateSales,
  writeCloseoutAlerts,
} from "./owner-shell-storage";
import type {
  CloseoutAlertItem,
  OwnerShellPreferences,
  UseOwnerShellStateProps,
} from "@/features/owner-shell/client/owner-shell-client-types";

function stableJson(value: unknown): string {
  try {
    return JSON.stringify(value ?? null);
  } catch {
    return "";
  }
}

function resolveStoredCloseoutAlerts(
  ownerShellPreferences: OwnerShellPreferences,
  bindsToServerAuth: boolean,
): CloseoutAlertItem[] {
  if (Array.isArray(ownerShellPreferences?.closeoutAlerts)) {
    return ownerShellPreferences.closeoutAlerts;
  }
  return readCloseoutAlerts(bindsToServerAuth);
}

function resolveStoredAcknowledgedDuplicateSales(
  ownerShellPreferences: OwnerShellPreferences,
  bindsToServerAuth: boolean,
): Record<string, string> {
  const stored = ownerShellPreferences?.acknowledgedDuplicateSales;
  if (stored && typeof stored === "object" && !Array.isArray(stored)) return stored;
  return readAcknowledgedDuplicateSales(bindsToServerAuth);
}

export function useOwnerShellState({
  bindsToServerAuth,
  ownerShellPreferences = {},
  onOwnerShellPreferencesChange = null,
  operationalEntries = [],
  activeBusinesses = [],
  configuredBusinesses = [],
  storeOperationalSettings = {},
  closeoutAlertEnabledForBusiness = () => false,
  setSelected = () => {},
}: UseOwnerShellStateProps) {
  const [ownerPage, setOwnerPage] = useState("home");
  const [selectedBusiness, setSelectedBusiness] = useState("all");
  const [archivedReadOnlyBusinessId, setArchivedReadOnlyBusinessId] = useState<string | null>(null);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [ownerManageCloseout, setOwnerManageCloseout] = useState<Record<string, unknown> | null>(null);
  const [closeoutAlerts, setCloseoutAlerts] = useState<CloseoutAlertItem[]>(
    () => resolveStoredCloseoutAlerts(ownerShellPreferences, bindsToServerAuth),
  );
  const [duplicateSummaryFocus, setDuplicateSummaryFocus] = useState<unknown>(null);
  const [shareSnapshot, setShareSnapshot] = useState<unknown>(null);
  const [acknowledgedDuplicateSales, setAcknowledgedDuplicateSales] = useState<Record<string, string>>(
    () => resolveStoredAcknowledgedDuplicateSales(ownerShellPreferences, bindsToServerAuth),
  );

  const navApply = useMemo(() => ({
    setOwnerPage,
    setSelectedBusiness,
    setArchivedReadOnlyBusinessId,
    setDuplicateSummaryFocus,
    setQuickAddOpen,
    setSelected,
    setCloseoutAlerts,
  }), [setSelected]);

  const activeViewBusiness = useMemo(
    () => resolveActiveViewBusiness({ activeBusinesses, selectedBusiness }),
    [activeBusinesses, selectedBusiness],
  );
  const activeOwnerStoreId = activeViewBusiness === "all" ? activeBusinesses[0]?.id : activeViewBusiness;
  const reportSettingsStoreId = archivedReadOnlyBusinessId || activeOwnerStoreId;

  const duplicateSalesAlerts = useMemo(
    () => buildDuplicateSalesAlerts({
      operationalEntries,
      activeBusinesses,
      acknowledgedDuplicateSales,
    }),
    [operationalEntries, activeBusinesses, acknowledgedDuplicateSales],
  );

  const {
    unseenCloseoutAlerts,
    ownerNotificationsVisible,
    ownerNotificationBadge,
  } = useMemo(
    () => buildOwnerNotificationState({
      closeoutAlerts,
      closeoutAlertEnabledForBusiness,
    }),
    [
      closeoutAlerts,
      closeoutAlertEnabledForBusiness,
    ],
  );

  useEffect(() => {
    writeCloseoutAlerts(closeoutAlerts, bindsToServerAuth);
  }, [bindsToServerAuth, closeoutAlerts]);

  useEffect(() => {
    writeAcknowledgedDuplicateSales(acknowledgedDuplicateSales, bindsToServerAuth);
  }, [acknowledgedDuplicateSales, bindsToServerAuth]);

  useEffect(() => {
    const incomingCloseoutAlerts = ownerShellPreferences?.closeoutAlerts;
    if (Array.isArray(incomingCloseoutAlerts) && stableJson(incomingCloseoutAlerts) !== stableJson(closeoutAlerts)) {
      setCloseoutAlerts(incomingCloseoutAlerts);
    }
    const incomingAcknowledgedDuplicateSales = ownerShellPreferences?.acknowledgedDuplicateSales;
    if (
      incomingAcknowledgedDuplicateSales
      && typeof incomingAcknowledgedDuplicateSales === "object"
      && !Array.isArray(incomingAcknowledgedDuplicateSales)
      && stableJson(incomingAcknowledgedDuplicateSales) !== stableJson(acknowledgedDuplicateSales)
    ) {
      setAcknowledgedDuplicateSales(incomingAcknowledgedDuplicateSales);
    }
  }, [acknowledgedDuplicateSales, closeoutAlerts, ownerShellPreferences]);

  useEffect(() => {
    if (typeof onOwnerShellPreferencesChange !== "function") return;
    const next = {
      ...(ownerShellPreferences || {}),
      closeoutAlerts,
      acknowledgedDuplicateSales,
    };
    if (stableJson(next) === stableJson(ownerShellPreferences)) return;
    onOwnerShellPreferencesChange(next);
  }, [
    acknowledgedDuplicateSales,
    closeoutAlerts,
    onOwnerShellPreferencesChange,
    ownerShellPreferences,
  ]);

  useEffect(() => {
    if (selectedBusiness !== "all" && !configuredBusinesses.some((business) => business.id === selectedBusiness)) {
      setSelectedBusiness("all");
    }
  }, [configuredBusinesses, selectedBusiness]);

  useEffect(() => {
    setCloseoutAlerts((current) => current.filter(
      (alert) => getStoreOperationalConfig(storeOperationalSettings, alert.businessId ?? "").closeoutAlert,
    ));
  }, [storeOperationalSettings]);

  const pushCloseoutAlert = useCallback((
    payload: Parameters<typeof buildCloseoutAlertRecord>[0],
    entry: OperationalEntry,
    actor: Parameters<typeof buildCloseoutAlertRecord>[2],
  ) => {
    if (!closeoutAlertEnabledForBusiness(payload.businessId)) return;
    setCloseoutAlerts((current) => upsertCloseoutAlert(
      current,
      buildCloseoutAlertRecord(payload, entry, actor),
    ));
  }, [closeoutAlertEnabledForBusiness]);

  const openCloseoutAlertInRegisterHandler = useCallback((alert: CloseoutAlertItem) => {
    openCloseoutAlertInRegister(alert, navApply, operationalEntries);
  }, [navApply, operationalEntries]);

  const dismissCloseoutAlert = useCallback((alertId: string) => {
    dismissCloseoutAlertRecord(alertId, navApply);
  }, [navApply]);

  const openDuplicateSummaryInRegisterHandler = useCallback((alert: CloseoutAlertItem) => {
    openDuplicateSummaryInRegister(alert, navApply);
  }, [navApply]);

  const changeOwnerPage = useCallback((page: string) => {
    setQuickAddOpen(false);
    navigateOwnerPage(page, navApply);
  }, [navApply]);

  const openQuickAddSummary = useCallback(() => {
    openOwnerQuickSummary(navApply);
  }, [navApply]);

  const openQuickAddExpense = useCallback(() => {
    openOwnerQuickExpense(navApply);
  }, [navApply]);

  const openNotifications = useCallback(() => {
    handleOwnerNotificationsClick({
      unseenCloseoutAlerts,
      apply: navApply,
    });
  }, [navApply, unseenCloseoutAlerts]);

  const resetOwnerShellNav = useCallback(() => {
    resetOwnerNavContext(navApply);
  }, [navApply]);

  return {
    ownerPage,
    setOwnerPage,
    selectedBusiness,
    setSelectedBusiness,
    archivedReadOnlyBusinessId,
    setArchivedReadOnlyBusinessId,
    quickAddOpen,
    setQuickAddOpen,
    helpOpen,
    setHelpOpen,
    ownerManageCloseout,
    setOwnerManageCloseout,
    closeoutAlerts,
    setCloseoutAlerts,
    duplicateSummaryFocus,
    setDuplicateSummaryFocus,
    shareSnapshot,
    setShareSnapshot,
    acknowledgedDuplicateSales,
    setAcknowledgedDuplicateSales,
    activeViewBusiness,
    activeOwnerStoreId,
    reportSettingsStoreId,
    duplicateSalesAlerts,
    unseenCloseoutAlerts,
    ownerNotificationsVisible,
    ownerNotificationBadge,
    pushCloseoutAlert,
    openCloseoutAlertInRegister: openCloseoutAlertInRegisterHandler,
    dismissCloseoutAlert,
    openDuplicateSummaryInRegister: openDuplicateSummaryInRegisterHandler,
    changeOwnerPage,
    openQuickAddSummary,
    openQuickAddExpense,
    openNotifications,
    resetOwnerShellNav,
  };
}
