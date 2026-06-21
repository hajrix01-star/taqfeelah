import { bindsToServerAuth } from "@/core/config/runtime-capabilities";
import type { PrototypeOwnerActor } from "./prototype-runtime-types";

export function resolvePrototypeOwnerActor(prototypeOwnerActor: PrototypeOwnerActor): PrototypeOwnerActor {
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
