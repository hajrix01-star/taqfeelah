async function fetchSaasAdminJson(path: string, init: RequestInit = {}) {
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

  return payload?.data ?? payload;
}

export async function fetchInvestorDashboard({ from, to }: { from: string; to: string }) {
  const search = new URLSearchParams({ from, to });
  return fetchSaasAdminJson(`/api/v1/saas-admin/analytics/investor-dashboard?${search.toString()}`);
}

export async function fetchSaasOrganizationAnalytics({
  from,
  to,
  billingType = "all",
  segment = "all",
  limit = 100,
}: {
  from: string;
  to: string;
  billingType?: string;
  segment?: string;
  limit?: number;
}) {
  const search = new URLSearchParams({
    from,
    to,
    billingType,
    segment,
    limit: String(limit),
  });
  return fetchSaasAdminJson(`/api/v1/saas-admin/analytics/organizations?${search.toString()}`);
}

export async function runSaasAnalyticsAggregate(snapshotDate?: string) {
  return fetchSaasAdminJson("/api/v1/saas-admin/analytics/aggregate", {
    method: "POST",
    body: JSON.stringify(snapshotDate ? { snapshotDate } : {}),
  });
}
