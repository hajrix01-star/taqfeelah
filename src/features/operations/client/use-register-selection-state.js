"use client";

import { useState } from "react";

export function useRegisterSelectionState({
  archivedBusinessIds = [],
} = {}) {
  const [selected, setSelected] = useState(null);
  const [voidTarget, setVoidTarget] = useState(null);
  const [restoreTarget, setRestoreTarget] = useState(null);
  const [savedOutflowShareTarget, setSavedOutflowShareTarget] = useState(null);
  const [pendingDuplicateSummary, setPendingDuplicateSummary] = useState(null);

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
    archivedBusinessIds,
  };
}
