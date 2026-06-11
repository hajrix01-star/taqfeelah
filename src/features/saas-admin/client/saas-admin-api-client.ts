import type {
  InvestorMetrics,
  SaasAccountDetails,
  SaasAccountsList,
  SaasOverview,
  SaasUsageReport,
  SystemHealthReport,
} from "@/features/saas-admin/types";

async function fetchSaasAdminJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    ...init,
    credentials: "include",
    headers: {
      "content-type": "application/json",
      ...(init.headers || {}),
    },
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = typeof payload?.error?.message === "string"
      ? payload.error.message
      : `SaaS admin API failed (${response.status})`;
    throw new Error(message);
  }

  return (payload?.data ?? payload) as T;
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
