import { readSessionBootState } from "@/features/auth/client/session-bridge";
import {
  BINDS_TO_SERVER_AUTH,
  readSavedSettings,
} from "@/components/taqfeelah-app/taqfeelah-app-boot";

export function readRuntimeAuthBoot() {
  return readSessionBootState({
    bindsToServerAuth: BINDS_TO_SERVER_AUTH,
    readSavedSettings,
    defaultStaff: [],
  });
}
