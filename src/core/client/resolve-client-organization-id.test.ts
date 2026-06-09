import { afterEach, describe, expect, it, vi } from "vitest";
import {
  readBuildTimeOrganizationId,
  resolveClientOrganizationId,
} from "./resolve-client-organization-id";

const ORG_UUID = "11111111-1111-4111-8111-111111111111";
const SESSION_ORG_UUID = "22222222-2222-4222-8222-222222222222";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("resolveClientOrganizationId", () => {
  it("prefers session organization id over build-time env", () => {
    vi.stubEnv("NEXT_PUBLIC_CLOSEOUTS_API_ORGANIZATION_ID", ORG_UUID);
    expect(resolveClientOrganizationId({
      sessionOrganizationId: SESSION_ORG_UUID,
    })).toBe(SESSION_ORG_UUID);
  });

  it("falls back to build-time env when session id is missing", () => {
    vi.stubEnv("NEXT_PUBLIC_CLOSEOUTS_API_ORGANIZATION_ID", ORG_UUID);
    expect(resolveClientOrganizationId({ sessionOrganizationId: "" })).toBe(ORG_UUID);
  });

  it("returns empty string when neither source is a valid uuid", () => {
    vi.stubEnv("NEXT_PUBLIC_CLOSEOUTS_API_ORGANIZATION_ID", "invalid");
    expect(resolveClientOrganizationId({
      sessionOrganizationId: "also-invalid",
    })).toBe("");
  });

  it("reads build-time organization id helper", () => {
    vi.stubEnv("NEXT_PUBLIC_CLOSEOUTS_API_ORGANIZATION_ID", ORG_UUID);
    expect(readBuildTimeOrganizationId()).toBe(ORG_UUID);
  });
});
