import { describe, expect, it, vi } from "vitest";
import {
  dequeueNextAppDialogItem,
  enqueueAppDialogItem,
} from "./app-dialog-queue";

describe("app-dialog-queue", () => {
  it("opens immediately when no dialog is active", () => {
    const item = { options: { title: "Test" }, resolve: () => {} };
    const result = enqueueAppDialogItem([], null, item);
    expect(result.queue).toEqual([]);
    expect(result.current).toEqual(item.options);
    expect(result.pendingResolve).toBe(item.resolve);
  });

  it("queues when a dialog is already active", () => {
    const active = { title: "Active" };
    const item = { options: { title: "Next" }, resolve: () => {} };
    const result = enqueueAppDialogItem([], active, item);
    expect(result.queue).toEqual([item]);
    expect(result.current).toBe(active);
    expect(result.pendingResolve).toBeNull();
  });

  it("dequeues the next dialog item", () => {
    const first = { options: { title: "First" }, resolve: () => {} };
    const second = { options: { title: "Second" }, resolve: () => {} };
    const result = dequeueNextAppDialogItem([first, second]);
    expect(result.next).toEqual(first);
    expect(result.queue).toEqual([second]);
  });
});

describe("app-dialog-bridge fallback", () => {
  it("falls back to native confirm when bridge is not installed", async () => {
    const confirm = vi.fn(() => true);
    vi.stubGlobal("window", { confirm });
    const { appConfirm, installAppDialogBridge } = await import("./app-dialog-bridge");
    installAppDialogBridge(null);
    await expect(appConfirm({ title: "Test", description: "Body" })).resolves.toBe(true);
    expect(confirm).toHaveBeenCalledWith("Test\n\nBody");
    vi.unstubAllGlobals();
  });
});
