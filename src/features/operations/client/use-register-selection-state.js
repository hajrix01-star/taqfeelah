"use client";

import { useMemo, useState } from "react";
import { resolveSelectedOperationReviewEnabled } from "./register-operations-selection.js";

export function useRegisterSelectionState({
  reviewEnabledForBusiness = () => false,
  archivedBusinessIds = [],
  ownerReviewEnabled = false,
}) {
  const [selected, setSelected] = useState(null);
  const [voidTarget, setVoidTarget] = useState(null);
  const [restoreTarget, setRestoreTarget] = useState(null);
  const [savedOutflowShareTarget, setSavedOutflowShareTarget] = useState(null);
  const [pendingDuplicateSummary, setPendingDuplicateSummary] = useState(null);

  const selectedOperationReviewEnabled = useMemo(
    () => resolveSelectedOperationReviewEnabled(
      selected,
      reviewEnabledForBusiness,
      archivedBusinessIds,
      ownerReviewEnabled,
    ),
    [archivedBusinessIds, ownerReviewEnabled, reviewEnabledForBusiness, selected],
  );

  return {
    selected,
    setSelected,
    voidTarget,
    setVoidTarget,
    restoreTarget,
    setRestoreTarget,
    savedOutflowShareTarget,
    setSavedOutflowShareTarget,
    pendingDuplicateSummary,
    setPendingDuplicateSummary,
    selectedOperationReviewEnabled,
  };
}
