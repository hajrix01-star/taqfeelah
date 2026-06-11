"use client";

import { logoutSessionViaApi } from "@/features/runtime-settings/client/runtime-session-and-settings-api-client";

export async function logoutSaasAdminSession() {
  await logoutSessionViaApi();
}

export function redirectToSaasAdminLogin(nextPath = "/saas-admin/overview") {
  const next = nextPath.startsWith("/saas-admin") ? nextPath : "/saas-admin/overview";
  window.location.assign(`/saas-admin/login?next=${encodeURIComponent(next)}`);
}
