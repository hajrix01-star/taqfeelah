import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { __resetAttachmentStorageConfigForTests } from "@/core/attachments/attachment-storage-mode";
import {
  LOCAL_STORAGE_PREFIX,
  registerLocalVpsAttachment,
  resolveLocalVpsAttachmentDataUrl,
} from "@/core/attachments/local-vps-attachment-storage";

const tinyPng = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

const TEST_ORG_ID = "8f63cf87-f2e2-4e2a-a20e-e8f637f0a9e1";
const TEST_STORE_ID = "302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c";

describe("local VPS attachment storage", () => {
  let tempRoot = "";

  beforeEach(async () => {
    tempRoot = await mkdtemp(path.join(os.tmpdir(), "taqfeelah-attachments-"));
    process.env.ATTACHMENT_STORAGE_ROOT = tempRoot;
    __resetAttachmentStorageConfigForTests();
  });

  afterEach(async () => {
    delete process.env.ATTACHMENT_STORAGE_ROOT;
    __resetAttachmentStorageConfigForTests();
    if (tempRoot) {
      await rm(tempRoot, { recursive: true, force: true });
    }
  });

  it("writes files under org/store and returns local storage key", async () => {
    const registered = await registerLocalVpsAttachment({
      organizationId: TEST_ORG_ID,
      storeId: TEST_STORE_ID,
      name: "proof.png",
      mimeType: "image/png",
      sizeBytes: 120,
      dataUrl: tinyPng,
    });

    expect(registered.storageKey.startsWith(LOCAL_STORAGE_PREFIX)).toBe(true);
    expect(registered.storageKey).toContain(`${TEST_ORG_ID}/${TEST_STORE_ID}/`);

    const resolved = await resolveLocalVpsAttachmentDataUrl(registered.storageKey);
    expect(resolved).toBe(tinyPng);
  });

  it("deduplicates identical uploads", async () => {
    const first = await registerLocalVpsAttachment({
      organizationId: TEST_ORG_ID,
      storeId: TEST_STORE_ID,
      mimeType: "image/png",
      sizeBytes: 120,
      dataUrl: tinyPng,
    });
    const second = await registerLocalVpsAttachment({
      organizationId: TEST_ORG_ID,
      storeId: TEST_STORE_ID,
      mimeType: "image/png",
      sizeBytes: 120,
      dataUrl: tinyPng,
    });

    expect(first.storageKey).toBe(second.storageKey);
  });
});
