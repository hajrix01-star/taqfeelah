import { describe, expect, it } from "vitest";
import {
  clearEntryAttachmentSourceCache,
  readResolvedAttachmentSourceCache,
  writeResolvedAttachmentSourceCache,
} from "./entry-attachment-source-cache";

describe("entry-attachment-source-cache", () => {
  it("stores and reads resolved attachment sources by store and id", () => {
    clearEntryAttachmentSourceCache();
    writeResolvedAttachmentSourceCache(
      "302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c",
      "22222222-2222-4222-8222-222222222222",
      "data:image/jpeg;base64,abc",
    );

    expect(readResolvedAttachmentSourceCache(
      "302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c",
      "22222222-2222-4222-8222-222222222222",
    )).toBe("data:image/jpeg;base64,abc");
  });

  it("clears cached attachment sources", () => {
    writeResolvedAttachmentSourceCache("store", "attachment", "data:image/jpeg;base64,x");
    clearEntryAttachmentSourceCache();
    expect(readResolvedAttachmentSourceCache("store", "attachment")).toBe("");
  });
});
