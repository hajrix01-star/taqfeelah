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
  ownerUsername: string;
  ownerPassword: string;
  storeName?: string;
  storeLocation?: string;
  planCode?: "starter" | "growth" | "enterprise";
};

export type CreateSaasAccountResponse = {
  organizationId: string;
  organizationName: string;
  ownerUserId: string;
  ownerMemberId: string;
  ownerUsername: string;
  storeId: string;
  storeName: string;
  subscriptionId: string;
  planCode: string;
  status: "trial";
  createdAt: string;
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
    status?: "active" | "suspended";
    planCode?: "starter" | "growth" | "enterprise";
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
