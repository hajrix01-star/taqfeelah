import { describe, expect, it } from "vitest";
import { shouldReloadAfterServiceWorkerControllerChange } from "./pwa-controller-change-reload";

describe("pwa controller change reload policy", () => {
  it("does not reload on first service worker controller assignment", () => {
    expect(shouldReloadAfterServiceWorkerControllerChange(false)).toBe(false);
  });

  it("reloads when replacing an existing controller during an update", () => {
    expect(shouldReloadAfterServiceWorkerControllerChange(true)).toBe(true);
  });
});
