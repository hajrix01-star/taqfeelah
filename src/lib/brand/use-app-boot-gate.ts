import { useCallback, useState } from "react";
import {
  markAppOpenSplashDone,
  resolveInitialBootSplashVisible,
} from "@/lib/brand/app-open-splash";

export function useAppBootGate() {
  const [showBootSplash, setShowBootSplash] = useState(resolveInitialBootSplashVisible);

  const dismissBootSplash = useCallback(() => {
    markAppOpenSplashDone();
    setShowBootSplash(false);
  }, []);

  return { showBootSplash, dismissBootSplash };
}
