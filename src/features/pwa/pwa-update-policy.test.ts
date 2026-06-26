import { describe, expect, it } from "vitest";
import {
  shouldRecoverStalePwaClient,
  shouldShowPwaUpdatePrompt,
} from "@/features/pwa/pwa-update-policy";

describe("shouldShowPwaUpdatePrompt", () => {
  const base = {
    clientBuild: "build-a",
    serverBuild: "build-b",
    hasWaitingServiceWorker: true,
    dismissedServerBuild: null,
  };

  it("returns false when builds already match", () => {
    expect(
      shouldShowPwaUpdatePrompt({
        ...base,
        clientBuild: "build-a",
        serverBuild: "build-a",
      }),
    ).toBe(false);
  });

  it("returns false when no waiting service worker exists", () => {
    expect(
      shouldShowPwaUpdatePrompt({
        ...base,
        hasWaitingServiceWorker: false,
      }),
    ).toBe(false);
  });

  it("returns true when server is ahead and SW is waiting", () => {
    expect(shouldShowPwaUpdatePrompt(base)).toBe(true);
  });

  it("returns false when user dismissed this server build", () => {
    expect(
      shouldShowPwaUpdatePrompt({
        ...base,
        dismissedServerBuild: "build-b",
      }),
    ).toBe(false);
  });

  it("returns false for dev builds", () => {
    expect(
      shouldShowPwaUpdatePrompt({
        ...base,
        clientBuild: "dev",
      }),
    ).toBe(false);
  });
});

describe("shouldRecoverStalePwaClient", () => {
  const base = {
    clientBuild: "build-a",
    serverBuild: "build-b",
    hasWaitingServiceWorker: false,
    attemptedRecoveryBuild: null,
  };

  it("returns true when the client is stale and no waiting service worker can activate", () => {
    expect(shouldRecoverStalePwaClient(base)).toBe(true);
  });

  it("returns false when the normal waiting-worker prompt is available", () => {
    expect(
      shouldRecoverStalePwaClient({
        ...base,
        hasWaitingServiceWorker: true,
      }),
    ).toBe(false);
  });

  it("returns false after recovery was already attempted for this server build", () => {
    expect(
      shouldRecoverStalePwaClient({
        ...base,
        attemptedRecoveryBuild: "build-b",
      }),
    ).toBe(false);
  });

  it("returns false when builds already match", () => {
    expect(
      shouldRecoverStalePwaClient({
        ...base,
        serverBuild: "build-a",
      }),
    ).toBe(false);
  });
});
