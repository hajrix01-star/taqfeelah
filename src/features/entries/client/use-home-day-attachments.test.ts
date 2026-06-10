import { describe, expect, it } from "vitest";
import { shouldFetchHomeDayAttachments } from "./use-home-day-attachments";

describe("shouldFetchHomeDayAttachments", () => {
  it("requests day entries when proofs exist but local thumbnails are missing", () => {
    expect(shouldFetchHomeDayAttachments({
      enabled: true,
      entriesApiEnabled: true,
      organizationId: "org-1",
      actorUserId: "user-1",
      storeId: "store-1",
      selectedDate: "2026-06-10",
      localItemCount: 0,
      proofsCount: 1,
    })).toBe(true);
  });

  it("skips fetch when local attachments are already available", () => {
    expect(shouldFetchHomeDayAttachments({
      enabled: true,
      entriesApiEnabled: true,
      organizationId: "org-1",
      actorUserId: "user-1",
      storeId: "store-1",
      selectedDate: "2026-06-10",
      localItemCount: 1,
      proofsCount: 1,
    })).toBe(false);
  });

  it("skips fetch when proofs count is zero", () => {
    expect(shouldFetchHomeDayAttachments({
      enabled: true,
      entriesApiEnabled: true,
      organizationId: "org-1",
      actorUserId: "user-1",
      storeId: "store-1",
      selectedDate: "2026-06-10",
      localItemCount: 0,
      proofsCount: 0,
    })).toBe(false);
  });
});
