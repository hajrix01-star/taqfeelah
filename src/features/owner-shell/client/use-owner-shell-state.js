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

export function useOwnerShellState({
  bindsToServerAuth,
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
  const [closeoutAlerts, setCloseoutAlerts] = useState(() => readCloseoutAlerts(bindsToServerAuth));
  const [duplicateReviewFocus, setDuplicateReviewFocus] = useState(null);
  const [attachmentReviewRequest, setAttachmentReviewRequest] = useState(null);
  const [shareSnapshot, setShareSnapshot] = useState(null);
  const [acknowledgedDuplicateSales, setAcknowledgedDuplicateSales] = useState(
    () => readAcknowledgedDuplicateSales(bindsToServerAuth),
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
