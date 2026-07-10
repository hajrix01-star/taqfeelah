import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ValidationError } from "@/core/errors/app-error";
import {
  ownerRequest,
  readJsonBody,
  setupRouteIntegrationEnv,
  teardownRouteIntegrationEnv,
  TEST_ORGANIZATION_ID,
  TEST_OWNER_USER_ID,
} from "./helpers";

const getRuntimeSettings = vi.fn();
const saveRuntimeSettings = vi.fn();

vi.mock("@/features/runtime-settings/server/runtime-settings-service", () => ({
  getRuntimeSettings,
  saveRuntimeSettings,
}));

describe("runtime settings route integration", () => {
  beforeEach(() => {
    setupRouteIntegrationEnv();
    getRuntimeSettings.mockReset();
    saveRuntimeSettings.mockReset();
  });

  afterEach(() => {
    teardownRouteIntegrationEnv();
  });

  it("GET returns runtime settings payload", async () => {
    getRuntimeSettings.mockResolvedValueOnce({
      id: "settings-1",
      settings: { notebookTheme: "yellow", staff: [] },
      schemaVersion: 1,
    });

    const { GET } = await import("../runtime/settings/route");
    const response = await GET(ownerRequest("http://localhost/api/v1/runtime/settings"));

    expect(response.status).toBe(200);
    const body = await readJsonBody<{ settings: { notebookTheme: string } }>(response);
    expect(body.settings.notebookTheme).toBe("yellow");
    expect(getRuntimeSettings).toHaveBeenCalledWith(expect.objectContaining({
      organizationId: TEST_ORGANIZATION_ID,
      actorUserId: TEST_OWNER_USER_ID,
      actorRole: "owner",
    }));
  });

  it("PUT saves runtime settings", async () => {
    saveRuntimeSettings.mockResolvedValueOnce({
      id: "settings-1",
      createdAt: "2026-06-06T10:00:00.000Z",
      settings: { notebookTheme: "ivory" },
    });

    const { PUT } = await import("../runtime/settings/route");
    const response = await PUT(
      ownerRequest("http://localhost/api/v1/runtime/settings", {
        method: "PUT",
        body: JSON.stringify({
          settings: { notebookTheme: "ivory" },
          reason: "owner_settings_explicit_save",
        }),
      }),
    );

    expect(response.status).toBe(200);
    const body = await readJsonBody<{ settings: { notebookTheme: string } }>(response);
    expect(body.settings.notebookTheme).toBe("ivory");
    expect(saveRuntimeSettings).toHaveBeenCalledWith(expect.objectContaining({
      settings: { notebookTheme: "ivory" },
      reason: "owner_settings_explicit_save",
      actorRole: "owner",
    }));
  });

  it("PUT saves blank notebook pattern in runtime settings", async () => {
    saveRuntimeSettings.mockResolvedValueOnce({
      id: "settings-1",
      createdAt: "2026-06-06T10:00:00.000Z",
      settings: { notebookTheme: "pureWhite", notebookPattern: "blank" },
    });

    const { PUT } = await import("../runtime/settings/route");
    const response = await PUT(
      ownerRequest("http://localhost/api/v1/runtime/settings", {
        method: "PUT",
        body: JSON.stringify({
          settings: { notebookTheme: "pureWhite", notebookPattern: "blank" },
          reason: "owner_settings_explicit_save",
        }),
      }),
    );

    expect(response.status).toBe(200);
    const body = await readJsonBody<{ settings: { notebookPattern: string } }>(response);
    expect(body.settings.notebookPattern).toBe("blank");
    expect(saveRuntimeSettings).toHaveBeenCalledWith(expect.objectContaining({
      settings: { notebookTheme: "pureWhite", notebookPattern: "blank" },
      reason: "owner_settings_explicit_save",
      actorRole: "owner",
    }));
  });

  it("PUT defaults to empty settings object when body.settings is missing", async () => {
    saveRuntimeSettings.mockResolvedValueOnce({
      id: "settings-1",
      createdAt: "2026-06-06T10:00:00.000Z",
      settings: {},
    });

    const { PUT } = await import("../runtime/settings/route");
    const response = await PUT(
      ownerRequest("http://localhost/api/v1/runtime/settings", {
        method: "PUT",
        body: JSON.stringify({ reason: "noop" }),
      }),
    );

    expect(response.status).toBe(200);
    expect(saveRuntimeSettings).toHaveBeenCalledWith(expect.objectContaining({
      settings: {},
      reason: "noop",
    }));
  });

  it("GET surfaces server validation errors", async () => {
    getRuntimeSettings.mockRejectedValueOnce(new ValidationError("Invalid runtime settings request."));

    const { GET } = await import("../runtime/settings/route");
    const response = await GET(ownerRequest("http://localhost/api/v1/runtime/settings"));

    expect(response.status).toBe(400);
    const body = await readJsonBody<{ error: { code: string } }>(response);
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(getRuntimeSettings).toHaveBeenCalledOnce();
  });
});
