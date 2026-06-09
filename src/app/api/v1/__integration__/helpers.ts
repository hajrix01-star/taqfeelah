import { vi } from "vitest";
import { __resetEnvCacheForTests } from "@/core/config/env";

export const TEST_ORGANIZATION_ID = "8f63cf87-f2e2-4e2a-a20e-e8f637f0a9e1";
export const TEST_STORE_ID = "302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c";
export const TEST_OWNER_USER_ID = "e8f3e35b-6051-4da3-8b10-979700c2f00f";
export const TEST_EMPLOYEE_USER_ID = "a1b2c3d4-e5f6-4789-a012-3456789abcde";
export const TEST_MEMBER_ID = "d4e5f6a7-b8c9-4012-d345-6789abcdef01";

export function setupRouteIntegrationEnv() {
  process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
  process.env.ALLOW_HEADER_AUTH_CONTEXT = "true";
  delete process.env.AUTH_SESSION_SECRET;
  delete process.env.AUTH_SESSION_COOKIE_NAME;
  __resetEnvCacheForTests();
}

export function teardownRouteIntegrationEnv() {
  vi.unstubAllEnvs();
  __resetEnvCacheForTests();
}

export function ownerRequest(url: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("x-organization-id", TEST_ORGANIZATION_ID);
  headers.set("x-user-id", TEST_OWNER_USER_ID);
  headers.set("x-member-role", "owner");
  if (init.body && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }
  return new Request(url, { ...init, headers });
}

export function employeeRequest(url: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("x-organization-id", TEST_ORGANIZATION_ID);
  headers.set("x-user-id", TEST_EMPLOYEE_USER_ID);
  headers.set("x-member-role", "employee");
  if (init.body && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }
  return new Request(url, { ...init, headers });
}

export function routeStoreContext(storeId = TEST_STORE_ID) {
  return { params: Promise.resolve({ storeId }) };
}

export const TEST_CLOSEOUT_ID = "c1o2s3e4-o5u6-4789-a012-closeout01";
export const TEST_ENTRY_ID = "a1b2c3d4-e5f6-4789-a012-3456789abcde";

export function routeEntryContext(
  storeId = TEST_STORE_ID,
  entryId = TEST_ENTRY_ID,
) {
  return { params: Promise.resolve({ storeId, entryId }) };
}

export function routeCloseoutContext(
  storeId = TEST_STORE_ID,
  closeoutId = TEST_CLOSEOUT_ID,
) {
  return { params: Promise.resolve({ storeId, closeoutId }) };
}

export function routeMemberContext(memberId = TEST_MEMBER_ID) {
  return { params: Promise.resolve({ memberId }) };
}

export async function readJsonBody<T = unknown>(response: Response): Promise<T> {
  return response.json() as Promise<T>;
}
