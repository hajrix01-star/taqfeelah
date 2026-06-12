import { readSessionBootState } from "@/features/auth/client/session-bridge";
import {
  BINDS_TO_SERVER_AUTH,
  readSavedSettings,
} from "@/components/prototype-runtime/prototype-runtime-boot";

export function readPrototypeAuthBoot() {
  return readSessionBootState({
    bindsToServerAuth: BINDS_TO_SERVER_AUTH,
    readSavedSettings,
    defaultStaff: [],
  });
}
