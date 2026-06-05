import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Returns [visible, show] — a boolean flag and a function that sets it true
 * for durationMs, then resets. Timer is cleaned up on unmount.
 */
export function useSavedNotice(durationMs = 2200): [boolean, () => void] {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setVisible(true);
    timerRef.current = setTimeout(() => {
      setVisible(false);
      timerRef.current = null;
    }, durationMs);
  }, [durationMs]);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  return [visible, show];
}
