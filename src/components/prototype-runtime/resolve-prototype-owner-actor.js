import { bindsToServerAuth } from "@/core/config/runtime-capabilities";

export function resolvePrototypeOwnerActor(prototypeOwnerActor) {
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
