import { bindsToServerAuth } from "@/core/config/runtime-capabilities";
import type { AppOwnerActor } from "./taqfeelah-app-types";

export function resolveOwnerActor(defaultOwnerActor: AppOwnerActor): AppOwnerActor {
  if (bindsToServerAuth()) {
    return {
      role: "owner",
      userId: defaultOwnerActor?.userId || "owner",
      nameAr: "",
      nameEn: "",
    };
  }
  return defaultOwnerActor;
}
