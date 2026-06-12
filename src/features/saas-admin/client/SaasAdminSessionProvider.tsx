"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import {
  platformAdminCan,
  type PlatformAdminPermission,
  type PlatformAdminRole,
} from "@/features/saas-admin/server/platform-admin-roles";
import type { SaasAdminSessionView } from "@/features/saas-admin/server/resolve-saas-admin-session-view";

type SaasAdminSessionContextValue = {
  session: SaasAdminSessionView;
  platformAdminRole: PlatformAdminRole;
  can: (permission: PlatformAdminPermission) => boolean;
};

const SaasAdminSessionContext = createContext<SaasAdminSessionContextValue | null>(null);

export function SaasAdminSessionProvider({
  session,
  children,
}: {
  session: SaasAdminSessionView;
  children: ReactNode;
}) {
  const value = useMemo<SaasAdminSessionContextValue>(() => ({
    session,
    platformAdminRole: session.platformAdminRole,
    can: (permission) => platformAdminCan(session.platformAdminRole, permission),
  }), [session]);

  return (
    <SaasAdminSessionContext.Provider value={value}>
      {children}
    </SaasAdminSessionContext.Provider>
  );
}

export function useSaasAdminSession() {
  const context = useContext(SaasAdminSessionContext);
  if (!context) {
    throw new Error("useSaasAdminSession must be used within SaasAdminSessionProvider.");
  }
  return context;
}
