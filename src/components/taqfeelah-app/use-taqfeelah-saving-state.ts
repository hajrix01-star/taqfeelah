"use client";

import { useRef, useState } from "react";

export function useTaqfeelahSavingState() {
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const [saved, setSaved] = useState(false);

  return {
    saving,
    setSaving,
    savingRef,
    saved,
    setSaved,
  };
}
