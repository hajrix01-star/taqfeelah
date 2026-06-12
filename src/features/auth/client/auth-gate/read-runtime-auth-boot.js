import { readSessionBootState } from "@/features/auth/client/session-bridge";
import {
  BINDS_TO_SERVER_AUTH,
  PROTOTYPE_ACCESS_MODE,
  PROTOTYPE_DEFAULT_STAFF,
  readSavedSettings,
} from "@/components/prototype-runtime/prototype-runtime-boot";

export function readPrototypeAuthBoot() {
  return readSessionBootState({
    bindsToServerAuth: BINDS_TO_SERVER_AUTH,
    prototypeAccessMode: PROTOTYPE_ACCESS_MODE,
    readSavedSettings,
    defaultStaff: PROTOTYPE_DEFAULT_STAFF,
  });
}
