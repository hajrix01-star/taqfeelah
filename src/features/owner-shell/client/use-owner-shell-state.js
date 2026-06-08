"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getStoreOperationalConfig } from "@/features/org-config/client/store-operational-config";
import { upsertCloseoutAlert, buildCloseoutAlertRecord } from "@/features/operations/operational-entry-save-helpers";
import {
  buildDuplicateSalesAlerts,
  buildOwnerNotificationState,
  buildPendingAttachmentReviews,
  resolveActiveViewBusiness,
} from "./owner-shell-notifications.js";
import {
  dismissCloseoutAlertRecord,
  handleOwnerNotificationsClick,
  navigateOwnerPage,
  openOwnerQuickExpense,
  openOwnerQuickSummary,
  resetOwnerNavContext,
  reviewCloseoutAlertRecord,
  reviewDuplicateSalesAlert,
} from "./owner-shell-navigation.js";
import {
  readAcknowledgedDuplicateSales,
  readCloseoutAlerts,
  writeAcknowledgedDuplicateSales,
  writeCloseoutAlerts,
} from "./owner-shell-storage.js";

function stableJson(value) {
  try {
    return JSON.stringify(value ?? null);
  } catch {
    return "";
  }
}

function resolveStoredCloseoutAlerts(ownerShellPreferences, bindsToServerAuth) {
  if (Array.isArray(ownerShellPreferences?.closeoutAlerts)) {
    return ownerShellPreferences.closeoutAlerts;
  }
  return readCloseoutAlerts(bindsToServerAuth);
}

function resolveStoredAcknowledgedDuplicateSales(ownerShellPreferences, bindsToServerAuth) {
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
  reviewEnabledForBusiness = () => false,
  attachmentAlertEnabledForBusiness = () => false,
  closeoutAlertEnabledForBusiness = () => false,
  setSelected = () => {},
}) {
  const [ownerPage, setOwnerPage] = useState("home");
  const [selectedBusiness, setSelectedBusiness] = useState("all");
  const [archivedReadOnlyBusinessId, setArchivedReadOnlyBusinessId] = useState(null);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [ownerReviewCloseout, setOwnerReviewCloseout] = useState(null);
  const [returnCloseoutTarget, setReturnCloseoutTarget] = useState(null);
  const [closeoutAlerts, setCloseoutAlerts] = useState(
    () => resolveStoredCloseoutAlerts(ownerShellPreferences, bindsToServerAuth),
  );
  const [duplicateReviewFocus, setDuplicateReviewFocus] = useState(null);
  const [attachmentReviewRequest, setAttachmentReviewRequest] = useState(null);
  const [shareSnapshot, setShareSnapshot] = useState(null);
  const [acknowledgedDuplicateSales, setAcknowledgedDuplicateSales] = useState(
    () => resolveStoredAcknowledgedDuplicateSales(ownerShellPreferences, bindsToServerAuth),
  );

  const navApply = useMemo(() => ({
    setOwnerPage,
    setSelectedBusiness,
    setArchivedReadOnlyBusinessId,
    setDuplicateReviewFocus,
    setAttachmentReviewRequest,
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
  const ownerReviewEnabled = activeViewBusiness === "all"
    ? activeBusinesses.some((business) => reviewEnabledForBusiness(business.id))
    : reviewEnabledForBusiness(activeOwnerStoreId);

  const duplicateSalesAlerts = useMemo(
    () => buildDuplicateSalesAlerts({
      operationalEntries,
      activeBusinesses,
      acknowledgedDuplicateSales,
    }),
    [operationalEntries, activeBusinesses, acknowledgedDuplicateSales],
  );

  const pendingAttachmentReviews = useMemo(
    () => buildPendingAttachmentReviews({
      operationalEntries,
      activeBusinesses,
      attachmentAlertEnabledForBusiness,
    }),
    [operationalEntries, activeBusinesses, attachmentAlertEnabledForBusiness],
  );

  const {
    unseenCloseoutAlerts,
    firstPendingAttachmentReview,
    ownerHasPendingReview,
    ownerNotificationsVisible,
    ownerNotificationBadge,
  } = useMemo(
    () => buildOwnerNotificationState({
      duplicateSalesAlerts,
      pendingAttachmentReviews,
      closeoutAlerts,
      closeoutAlertEnabledForBusiness,
    }),
    [
      duplicateSalesAlerts,
      pendingAttachmentReviews,
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
      (alert) => getStoreOperationalConfig(storeOperationalSettings, alert.businessId).closeoutAlert,
    ));
  }, [storeOperationalSettings]);

  const pushCloseoutAlert = useCallback((payload, entry, actor) => {
    if (!closeoutAlertEnabledForBusiness(payload.businessId)) return;
    setCloseoutAlerts((current) => upsertCloseoutAlert(
      current,
      buildCloseoutAlertRecord(payload, entry, actor),
    ));
  }, [closeoutAlertEnabledForBusiness]);

  const reviewCloseoutAlert = useCallback((alert) => {
    reviewCloseoutAlertRecord(alert, navApply, operationalEntries);
  }, [navApply, operationalEntries]);

  const dismissCloseoutAlert = useCallback((alertId) => {
    dismissCloseoutAlertRecord(alertId, navApply);
  }, [navApply]);

  const reviewDuplicateSales = useCallback((alert) => {
    reviewDuplicateSalesAlert(alert, navApply);
  }, [navApply]);

  const changeOwnerPage = useCallback((page) => {
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
      duplicateSalesAlerts,
      firstPendingAttachmentReview,
      unseenCloseoutAlerts,
      apply: navApply,
    });
  }, [duplicateSalesAlerts, firstPendingAttachmentReview, navApply, unseenCloseoutAlerts]);

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
    ownerReviewCloseout,
    setOwnerReviewCloseout,
    returnCloseoutTarget,
    setReturnCloseoutTarget,
    closeoutAlerts,
    setCloseoutAlerts,
    duplicateReviewFocus,
    setDuplicateReviewFocus,
    attachmentReviewRequest,
    setAttachmentReviewRequest,
    shareSnapshot,
    setShareSnapshot,
    acknowledgedDuplicateSales,
    setAcknowledgedDuplicateSales,
    activeViewBusiness,
    activeOwnerStoreId,
    reportSettingsStoreId,
    ownerReviewEnabled,
    duplicateSalesAlerts,
    pendingAttachmentReviews,
    firstPendingAttachmentReview,
    unseenCloseoutAlerts,
    ownerHasPendingReview,
    ownerNotificationsVisible,
    ownerNotificationBadge,
    pushCloseoutAlert,
    reviewCloseoutAlert,
    dismissCloseoutAlert,
    reviewDuplicateSales,
    changeOwnerPage,
    openQuickAddSummary,
    openQuickAddExpense,
    openNotifications,
    resetOwnerShellNav,
  };
}
