import { afterEach, describe, expect, it } from "vitest";
import {
  resolveRuntimeApiActorContext,
  resolveRuntimeCapabilities,
} from "./runtime-capabilities";

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("runtime capabilities", () => {
  it("enables server auth only in production without prototype access", () => {
    process.env.NEXT_PUBLIC_APP_MODE = "production";
    process.env.NEXT_PUBLIC_PROTOTYPE_ACCESS_MODE = "false";

    const caps = resolveRuntimeCapabilities(process.env);
    expect(caps.appInProductionMode).toBe(true);
    expect(caps.prototypeAccessMode).toBe(false);
    expect(caps.bindsToServerAuth).toBe(true);
  });

  it("keeps prototype access open by default until auth launch", () => {
    process.env.NEXT_PUBLIC_APP_MODE = "production";
    delete process.env.NEXT_PUBLIC_PROTOTYPE_ACCESS_MODE;

    const caps = resolveRuntimeCapabilities(process.env);
    expect(caps.prototypeAccessMode).toBe(true);
    expect(caps.bindsToServerAuth).toBe(false);
  });

  it("cascades entries and phase9 flags from closeouts when unset", () => {
    process.env.NEXT_PUBLIC_CLOSEOUTS_API_ENABLED = "true";
    delete process.env.NEXT_PUBLIC_ENTRIES_API_ENABLED;
    delete process.env.NEXT_PUBLIC_PHASE9_API_ENABLED;

    const caps = resolveRuntimeCapabilities(process.env);
    expect(caps.closeoutsApiEnabled).toBe(true);
    expect(caps.entriesApiEnabled).toBe(true);
    expect(caps.phase9ApiEnabled).toBe(true);
    expect(caps.orgConfigApiEnabled).toBe(true);
    expect(caps.registerEntriesPaginationEnabled).toBe(true);
  });

  it("reads public DB flags when no env object is passed", () => {
    process.env.NEXT_PUBLIC_CLOSEOUTS_API_ENABLED = "true";
    process.env.NEXT_PUBLIC_ENTRIES_API_ENABLED = "true";
    process.env.NEXT_PUBLIC_ORG_CONFIG_API_ENABLED = "true";
    process.env.NEXT_PUBLIC_PHASE9_API_ENABLED = "true";
    process.env.NEXT_PUBLIC_REGISTER_ENTRIES_PAGINATION_ENABLED = "true";

    const caps = resolveRuntimeCapabilities();

    expect(caps.closeoutsApiEnabled).toBe(true);
    expect(caps.entriesApiEnabled).toBe(true);
    expect(caps.orgConfigApiEnabled).toBe(true);
    expect(caps.phase9ApiEnabled).toBe(true);
    expect(caps.registerEntriesPaginationEnabled).toBe(true);
    expect(caps.usesRuntimeSettingsApi).toBe(true);
  });

  it("builds api actor context for owner and employee sessions", () => {
    process.env.NEXT_PUBLIC_CLOSEOUTS_API_ORGANIZATION_ID = "11111111-1111-4111-8111-111111111111";
    process.env.NEXT_PUBLIC_CLOSEOUTS_API_OWNER_USER_ID = "22222222-2222-4222-8222-222222222222";

    const owner = resolveRuntimeApiActorContext({
      employee: false,
      sessionUserId: "33333333-3333-4333-8333-333333333333",
      reportingBusinesses: [{ id: "shami" }, { id: "arz" }],
      env: process.env,
    });
    expect(owner.apiActorRole).toBe("owner");
    expect(owner.apiActorUserId).toBe("33333333-3333-4333-8333-333333333333");
    expect(owner.apiTargetStoreIdsKey).toBe("shami|arz");

    const employee = resolveRuntimeApiActorContext({
      employee: true,
      sessionUserId: "44444444-4444-4444-8444-444444444444",
      activeEmployee: { id: "ahmed", apiUserId: "55555555-5555-4555-8555-555555555555" },
      assignedEmployeeBusinesses: [{ id: "shami" }],
      env: process.env,
    });
    expect(employee.apiActorRole).toBe("employee");
    expect(employee.apiActorUserId).toBe("44444444-4444-4444-8444-444444444444");
    expect(employee.apiTargetStoreIdsKey).toBe("shami");
  });

  it("falls back to active employee store ids when assigned businesses are empty", () => {
    process.env.NEXT_PUBLIC_CLOSEOUTS_API_ORGANIZATION_ID = "11111111-1111-4111-8111-111111111111";

    const employee = resolveRuntimeApiActorContext({
      employee: true,
      sessionUserId: "44444444-4444-4444-8444-444444444444",
      activeEmployee: {
        id: "ahmed",
        storeIds: [
          "22222222-2222-4222-8222-222222222222",
          "33333333-3333-4333-8333-333333333333",
        ],
      },
      assignedEmployeeBusinesses: [],
      env: process.env,
    });

    expect(employee.apiTargetStoreIdsKey).toBe(
      "22222222-2222-4222-8222-222222222222|33333333-3333-4333-8333-333333333333",
    );
  });
});
