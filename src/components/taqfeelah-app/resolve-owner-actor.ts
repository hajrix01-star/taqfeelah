import { bindsToServerAuth } from "@/core/config/runtime-capabilities";
import type { PrototypeOwnerActor } from "./taqfeelah-app-types";

export function resolveOwnerActor(prototypeOwnerActor: PrototypeOwnerActor): PrototypeOwnerActor {
  if (bindsToServerAuth()) {
    return {
      role: "owner",
      userId: prototypeOwnerActor?.userId || "owner",
      nameAr: "",
      nameEn: "",
    };
  }
  return prototypeOwnerActor;
}
