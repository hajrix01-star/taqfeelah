import type { PlanCatalogRow } from "@/features/billing/types";
import type {
  InvestorMetrics,
  SaasAccountDetails,
  SaasAccountsList,
  SaasOverview,
  SaasUsageReport,
  SystemHealthReport,
} from "@/features/saas-admin/types";

import { createSaasAdminApiError, type ApiErrorPayload } from "@/features/saas-admin/client/api-error";

async function fetchSaasAdminJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    ...init,
    credentials: "include",
    headers: {
      "content-type": "application/json",
      ...(init.headers || {}),
    },
  });

  const payload = await response.json().catch(() => ({})) as ApiErrorPayload;
  if (!response.ok) {
    throw createSaasAdminApiError(payload, response.status);
  }

  return ((payload as { data?: T }).data ?? payload) as T;
}

export async function fetchSaasOverview() {
  return fetchSaasAdminJson<SaasOverview>("/api/v1/saas-admin/overview");
}

export async function fetchSaasAccounts(params: {
  search?: string;
  status?: string;
  plan?: string;
  page?: number;
  pageSize?: number;
}) {
  const search = new URLSearchParams();
  if (params.search) search.set("search", params.search);
  if (params.status) search.set("status", params.status);
  if (params.plan) search.set("plan", params.plan);
  if (params.page) search.set("page", String(params.page));
  if (params.pageSize) search.set("pageSize", String(params.pageSize));
  return fetchSaasAdminJson<SaasAccountsList>(`/api/v1/saas-admin/accounts?${search.toString()}`);
}

export async function fetchSaasAccountDetails(id: string) {
  return fetchSaasAdminJson<SaasAccountDetails>(`/api/v1/saas-admin/accounts/${id}`);
}

export async function fetchSaasUsage(months = 6) {
  return fetchSaasAdminJson<SaasUsageReport>(`/api/v1/saas-admin/usage?months=${months}`);
}

export async function fetchInvestorMetrics() {
  return fetchSaasAdminJson<InvestorMetrics>("/api/v1/saas-admin/investor-metrics");
}

export async function fetchSystemHealth() {
  return fetchSaasAdminJson<SystemHealthReport>("/api/v1/saas-admin/system-health");
}

export async function runSaasAnalyticsAggregate(snapshotDate?: string) {
  return fetchSaasAdminJson("/api/v1/saas-admin/analytics/aggregate", {
    method: "POST",
    body: JSON.stringify(snapshotDate ? { snapshotDate } : {}),
  });
}

export type CreateSaasAccountPayload = {
  organizationName: string;
  ownerName: string;
  ownerPhone: string;
  storeName?: string;
  storeLocation?: string;
  planCode?: "trial" | "starter" | "growth" | "enterprise";
};

export type CreateSaasAccountResponse = {
  organizationId: string;
  organizationName: string;
  ownerName: string;
  ownerPhone: string;
  setupUrl: string;
  setupExpiresAt: string;
  storeId: string;
  storeName: string;
  subscriptionId: string;
  planCode: string;
  status: "pending_activation";
  createdAt: string;
};

export type PlanCatalogList = {
  plans: PlanCatalogRow[];
};

export type AccountSetupLinkResponse = {
  setupUrl: string;
  expiresAt: string;
  purpose: "onboarding" | "password_reset";
};

export async function createSaasAccount(payload: CreateSaasAccountPayload) {
  return fetchSaasAdminJson<CreateSaasAccountResponse>("/api/v1/saas-admin/accounts", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export type CreateSaasAccountMemberPayload = {
  name: string;
  role: "manager" | "employee";
  pin: string;
  storeIds?: string[];
};

export async function createSaasAccountMember(
  organizationId: string,
  payload: CreateSaasAccountMemberPayload,
) {
  return fetchSaasAdminJson(`/api/v1/saas-admin/accounts/${organizationId}/members`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateSaasAccount(
  organizationId: string,
  payload: {
    organizationName?: string;
    status?: "active" | "suspended" | "archived";
    planCode?: "trial" | "starter" | "growth" | "enterprise";
  },
) {
  return fetchSaasAdminJson(`/api/v1/saas-admin/accounts/${organizationId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function updateSaasAccountMember(
  organizationId: string,
  memberId: string,
  payload: {
    name?: string;
    role?: "manager" | "employee";
    status?: "active" | "inactive";
    pin?: string;
    storeIds?: string[];
  },
) {
  return fetchSaasAdminJson(`/api/v1/saas-admin/accounts/${organizationId}/members/${memberId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function updateSaasAccountOwner(
  organizationId: string,
  payload: { ownerName?: string; ownerUsername?: string; ownerPassword?: string },
) {
  return fetchSaasAdminJson(`/api/v1/saas-admin/accounts/${organizationId}/owner`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function fetchPlanCatalog() {
  return fetchSaasAdminJson<PlanCatalogList>("/api/v1/saas-admin/plans");
}

export async function updatePlanCatalogRow(row: PlanCatalogRow) {
  return fetchSaasAdminJson<{ plan: PlanCatalogRow }>("/api/v1/saas-admin/plans", {
    method: "PATCH",
    body: JSON.stringify(row),
  });
}

export async function createAccountSetupLink(
  organizationId: string,
  purpose: "onboarding" | "password_reset" = "password_reset",
) {
  return fetchSaasAdminJson<AccountSetupLinkResponse>(
    `/api/v1/saas-admin/accounts/${organizationId}/setup-link`,
    {
      method: "POST",
      body: JSON.stringify({ purpose }),
    },
  );
}

export type PlatformAdminRole = "owner" | "support";

export type PlatformAdminRow = {
  userId: string;
  name: string;
  username: string | null;
  loginPhone: string | null;
  platformRole: PlatformAdminRole;
  grantedAt: string | null;
  source: "database" | "env";
  canRevoke: boolean;
};

export type PlatformAdminLookup = {
  userId: string;
  name: string;
  username: string | null;
  loginPhone: string | null;
  hasPasswordLogin: boolean;
  alreadyGranted: boolean;
};

export async function fetchPlatformAdmins() {
  return fetchSaasAdminJson<{ admins: PlatformAdminRow[] }>("/api/v1/saas-admin/platform-admins");
}

export async function lookupPlatformAdmin(username: string) {
  return fetchSaasAdminJson<{ candidate: PlatformAdminLookup }>("/api/v1/saas-admin/platform-admins", {
    method: "POST",
    body: JSON.stringify({ action: "lookup", username }),
  }).then((payload) => payload.candidate);
}

export async function grantPlatformAdminAccess(userId: string, role: PlatformAdminRole = "support") {
  return fetchSaasAdminJson<{ admin: PlatformAdminRow }>("/api/v1/saas-admin/platform-admins", {
    method: "POST",
    body: JSON.stringify({ action: "grant", userId, role }),
  });
}

export async function createPlatformAdmin(payload: {
  name: string;
  username: string;
  password: string;
  role?: PlatformAdminRole;
}) {
  return fetchSaasAdminJson<{ admin: PlatformAdminRow }>("/api/v1/saas-admin/platform-admins", {
    method: "POST",
    body: JSON.stringify({ action: "create", ...payload, role: payload.role ?? "support" }),
  });
}

export async function updatePlatformAdminRole(userId: string, role: PlatformAdminRole) {
  return fetchSaasAdminJson<{ admin: PlatformAdminRow }>(
    `/api/v1/saas-admin/platform-admins/${userId}`,
    {
      method: "PATCH",
      body: JSON.stringify({ role }),
    },
  );
}

export async function revokePlatformAdminAccess(userId: string) {
  return fetchSaasAdminJson<{ revoked: boolean; userId: string }>(
    `/api/v1/saas-admin/platform-admins/${userId}`,
    { method: "DELETE" },
  );
}

export async function repairSaasAccountFoundation(organizationId: string) {
  return fetchSaasAdminJson<{
    organizationId: string;
    repaired: boolean;
    action: string;
    ownerName: string;
    storeId: string;
  }>(`/api/v1/saas-admin/accounts/${organizationId}/repair-foundation`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}
