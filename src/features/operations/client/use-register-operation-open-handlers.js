"use client";

import { useCallback } from "react";
import {
  resolveOwnerOperationOpenAction,
  resolveRestoreOperationTarget,
  resolveVoidOperationTarget,
} from "./register-operations-selection.js";

export function useRegisterOperationOpenHandlers({
  operationalEntries = [],
  archivedBusinessIds = [],
  entryIsVoided = () => false,
  bindsToServerAuth = false,
  closeoutsApiDbSource = false,
  readDailyCloseouts = () => [],
  setSelected = () => {},
  setVoidTarget = () => {},
  setRestoreTarget = () => {},
  setOwnerManageCloseout = () => {},
}) {
  const handleOpenOwnerOperation = useCallback((entry) => {
    const action = resolveOwnerOperationOpenAction(entry, {
      bindsToServerAuth,
      closeoutsApiDbSource,
      readDailyCloseouts,
    });
    if (action.kind === "closeout" && action.closeout) {
      setOwnerManageCloseout(action.closeout);
      return;
    }
    setSelected(action.entry);
  }, [
    bindsToServerAuth,
    closeoutsApiDbSource,
    readDailyCloseouts,
    setOwnerManageCloseout,
    setSelected,
  ]);

  const requestVoidOperation = useCallback((entryId) => {
    const target = resolveVoidOperationTarget(
      operationalEntries,
      entryId,
      archivedBusinessIds,
      entryIsVoided,
    );
    if (target) setVoidTarget(target);
  }, [archivedBusinessIds, entryIsVoided, operationalEntries, setVoidTarget]);

  const requestRestoreOperation = useCallback((entryId) => {
    const target = resolveRestoreOperationTarget(
      operationalEntries,
      entryId,
      archivedBusinessIds,
      entryIsVoided,
    );
    if (target) setRestoreTarget(target);
  }, [archivedBusinessIds, entryIsVoided, operationalEntries, setRestoreTarget]);

  return {
    handleOpenOwnerOperation,
    requestVoidOperation,
    requestRestoreOperation,
  };
}
