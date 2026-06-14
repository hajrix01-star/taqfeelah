import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { __resetAttachmentStorageConfigForTests } from "@/core/attachments/attachment-storage-mode";
import { registerAttachment } from "@/core/attachments/register-attachment";
import { resolveAttachmentDataUrl } from "@/core/attachments/resolve-attachment-data-url";

const tinyPng = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

const TEST_ORG_ID = "8f63cf87-f2e2-4e2a-a20e-e8f637f0a9e1";
const TEST_STORE_ID = "302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c";

describe("registerAttachment", () => {
  let tempRoot = "";

  beforeEach(async () => {
    tempRoot = await mkdtemp(path.join(os.tmpdir(), "taqfeelah-register-attachment-"));
    process.env.ATTACHMENT_STORAGE_ROOT = tempRoot;
    __resetAttachmentStorageConfigForTests();
  });

  afterEach(async () => {
    delete process.env.ATTACHMENT_STORAGE_MODE;
    delete process.env.ATTACHMENT_STORAGE_ROOT;
    __resetAttachmentStorageConfigForTests();
    if (tempRoot) {
      await rm(tempRoot, { recursive: true, force: true });
    }
  });

  it("uses local storage when mode is local", async () => {
    process.env.ATTACHMENT_STORAGE_MODE = "local";

    const registered = await registerAttachment({
      organizationId: TEST_ORG_ID,
      storeId: TEST_STORE_ID,
      kind: "image",
      mimeType: "image/png",
      sizeBytes: 120,
      dataUrl: tinyPng,
    });

    expect(registered.storageKey.startsWith("local:v1:")).toBe(true);
    await expect(resolveAttachmentDataUrl(registered.storageKey)).resolves.toBe(tinyPng);
  });

  it("uses inline storage when mode is inline", async () => {
    process.env.ATTACHMENT_STORAGE_MODE = "inline";

    const registered = await registerAttachment({
      organizationId: TEST_ORG_ID,
      storeId: TEST_STORE_ID,
      kind: "image",
      mimeType: "image/png",
      sizeBytes: 120,
      dataUrl: tinyPng,
    });

    expect(registered.storageKey.startsWith("inline:v1:")).toBe(true);
    await expect(resolveAttachmentDataUrl(registered.storageKey)).resolves.toBe(tinyPng);
  });
});
