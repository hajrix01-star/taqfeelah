"use client";

import {
  createTaqfeelahAppAuthHandlers,
  type TaqfeelahAppAuthHandlerDeps,
} from "@/features/auth/client/taqfeelah-app-auth-handlers";

export function useTaqfeelahAuthActions(deps: TaqfeelahAppAuthHandlerDeps) {
  return createTaqfeelahAppAuthHandlers(deps);
}
