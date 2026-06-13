import { describe, expect, it } from "vitest";
import { shouldShowPwaUpdatePrompt } from "@/features/pwa/pwa-update-policy";

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
