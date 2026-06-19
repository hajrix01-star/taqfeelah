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
  loginPhone?: string;
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

export type UpdateSaasAccountSubscriptionPayload = {
  planCode?: "trial" | "starter" | "growth" | "enterprise";
  status?: "trialing" | "active" | "past_due" | "canceled";
  billingCycle?: "monthly" | "yearly";
  extendPeriodDays?: number;
  activatePaid?: boolean;
  acknowledgeUsageExceedsLimits?: boolean;
};

export type UpdateSaasAccountSubscriptionResponse = {
  organizationId: string;
  subscriptionId: string;
  planCode: string;
  status: string;
  billingCycle: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  changeType: "upgrade" | "downgrade" | "renewal" | "status" | "mixed";
  updatedAt: string;
};

export async function updateSaasAccountSubscription(
  organizationId: string,
  payload: UpdateSaasAccountSubscriptionPayload,
) {
  return fetchSaasAdminJson<UpdateSaasAccountSubscriptionResponse>(
    `/api/v1/saas-admin/accounts/${organizationId}/subscription`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );
}

export async function createSaasAccountStore(
  organizationId: string,
  payload: {
    name: string;
    location?: string;
  },
) {
  return fetchSaasAdminJson(`/api/v1/saas-admin/accounts/${organizationId}/stores`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateSaasAccountStore(
  organizationId: string,
  storeId: string,
  payload: {
    name?: string;
    location?: string;
    status?: "active" | "archived";
    reason?: string;
  },
) {
  return fetchSaasAdminJson(`/api/v1/saas-admin/accounts/${organizationId}/stores/${storeId}`, {
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
    loginPhone?: string;
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
  payload: { ownerName?: string; ownerUsername?: string; ownerPhone?: string; ownerPassword?: string },
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

export async function updatePlatformAdminProfile(
  userId: string,
  payload: {
    name?: string;
    username?: string;
    password?: string;
  },
) {
  return fetchSaasAdminJson<{ admin: PlatformAdminRow }>(
    `/api/v1/saas-admin/platform-admins/${userId}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );
}

export async function revokePlatformAdminAccess(userId: string) {
  return fetchSaasAdminJson<{ revoked: boolean; userId: string }>(
    `/api/v1/saas-admin/platform-admins/${userId}`,
    { method: "DELETE" },
  );
}

export type SaasAccountSalesChannel = {
  id: string;
  name: string;
  status: "active" | "retired";
  retiredAt: string | null;
  createdAt: string;
};

export async function fetchSaasAccountStoreSalesChannels(
  organizationId: string,
  storeId: string,
  status: "active" | "retired" | "all" = "all",
) {
  const search = new URLSearchParams();
  if (status !== "all") search.set("status", status);
  const query = search.toString();
  return fetchSaasAdminJson<{ storeId: string; channels: SaasAccountSalesChannel[] }>(
    `/api/v1/saas-admin/accounts/${organizationId}/stores/${storeId}/sales-channels${query ? `?${query}` : ""}`,
  );
}

export async function createSaasAccountStoreSalesChannel(
  organizationId: string,
  storeId: string,
  payload: {
    name: string;
    status?: "active" | "retired";
    reason?: string;
  },
) {
  return fetchSaasAdminJson<{ channel: SaasAccountSalesChannel }>(
    `/api/v1/saas-admin/accounts/${organizationId}/stores/${storeId}/sales-channels`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export async function updateSaasAccountStoreSalesChannel(
  organizationId: string,
  storeId: string,
  payload: {
    salesChannelId: string;
    status: "active" | "retired";
    reason?: string;
  },
) {
  return fetchSaasAdminJson<SaasAccountSalesChannel>(
    `/api/v1/saas-admin/accounts/${organizationId}/stores/${storeId}/sales-channels`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
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

async function fetchAuthJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    ...init,
    credentials: "include",
    headers: {
      "content-type": "application/json",
      ...(init.headers || {}),
    },
  });

  const payload = await response.json().catch(() => ({})) as { data?: T; error?: { message?: string } };
  if (!response.ok) {
    throw new Error(typeof payload?.error?.message === "string" ? payload.error.message : "Request failed.");
  }

  return (payload.data ?? payload) as T;
}

export async function requestPlatformAdminPasswordResetViaApi({ email }: { email: string }) {
  return fetchAuthJson<{ success: boolean; message?: string }>(
    "/api/v1/auth/platform-admin/password-reset/request",
    {
      method: "POST",
      body: JSON.stringify({ email }),
    },
  );
}

export async function loginPlatformAdminSessionViaApi({
  email,
  password,
}: {
  email: string;
  password: string;
}) {
  return fetchAuthJson<{
    organizationId: string;
    userId: string;
    role: string;
    displayName: string;
    mustChangePassword?: boolean;
  }>("/api/v1/auth/session", {
    method: "POST",
    body: JSON.stringify({
      mode: "platform_admin_password",
      email: email.trim(),
      password,
    }),
  });
}

export async function validatePlatformAdminPasswordResetTokenViaApi(token: string) {
  const search = new URLSearchParams({ token, audience: "platform_admin" });
  return fetchAuthJson<{ valid: boolean; status?: string }>(
    `/api/v1/auth/platform-admin/password-reset/validate?${search.toString()}`,
  );
}

export async function confirmPlatformAdminPasswordResetViaApi({
  token,
  newPassword,
  confirmPassword,
}: {
  token: string;
  newPassword: string;
  confirmPassword: string;
}) {
  return fetchAuthJson<{ success: boolean }>(
    "/api/v1/auth/platform-admin/password-reset/confirm",
    {
      method: "POST",
      body: JSON.stringify({ token, newPassword, confirmPassword }),
    },
  );
}
