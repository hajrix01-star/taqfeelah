"use client";

import { useCallback, useMemo } from "react";
import {
  resolveOwnerOperationOpenAction,
  resolveRestoreOperationTarget,
  resolveVoidOperationTarget,
} from "./register-operations-selection.js";
import { useRegisterEntriesCatalog } from "./use-register-entries-catalog";

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
  const registerEntriesCatalog = useRegisterEntriesCatalog();
  const entryCatalogs = useMemo(
    () => [operationalEntries, registerEntriesCatalog],
    [operationalEntries, registerEntriesCatalog],
  );
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
      entryCatalogs,
      entryId,
      archivedBusinessIds,
      entryIsVoided,
    );
    if (target) setVoidTarget(target);
  }, [archivedBusinessIds, entryCatalogs, entryIsVoided, setVoidTarget]);

  const requestRestoreOperation = useCallback((entryId) => {
    const target = resolveRestoreOperationTarget(
      entryCatalogs,
      entryId,
      archivedBusinessIds,
      entryIsVoided,
    );
    if (target) setRestoreTarget(target);
  }, [archivedBusinessIds, entryCatalogs, entryIsVoided, setRestoreTarget]);

  return {
    handleOpenOwnerOperation,
    requestVoidOperation,
    requestRestoreOperation,
  };
}
