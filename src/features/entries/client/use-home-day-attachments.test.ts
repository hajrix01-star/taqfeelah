import { describe, expect, it } from "vitest";
import {
  resolveHomeDayAttachmentGroup,
  shouldFetchHomeDayAttachments,
} from "./use-home-day-attachments";

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

  it("requests day entries when server reports more proofs than local cache", () => {
    expect(shouldFetchHomeDayAttachments({
      enabled: true,
      entriesApiEnabled: true,
      organizationId: "org-1",
      actorUserId: "user-1",
      storeId: "store-1",
      selectedDate: "2026-06-10",
      localItemCount: 1,
      proofsCount: 3,
    })).toBe(true);
  });

  it("skips fetch when local attachments already cover the proof count", () => {
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

describe("resolveHomeDayAttachmentGroup", () => {
  const salesOnly = { date: "2026-06-10", items: [{ id: "sales-proof" }] };
  const salesAndPurchases = {
    date: "2026-06-10",
    items: [{ id: "sales-proof" }, { id: "purchase-proof" }],
  };

  it("prefers fetched day entries after a successful fetch", () => {
    expect(resolveHomeDayAttachmentGroup({
      localGroup: salesOnly,
      fetchedGroup: salesAndPurchases,
      shouldFetchDayEntries: true,
      fetchSucceeded: true,
    })).toEqual(salesAndPurchases);
  });

  it("falls back to local attachments when fetch fails", () => {
    expect(resolveHomeDayAttachmentGroup({
      localGroup: salesOnly,
      fetchedGroup: null,
      shouldFetchDayEntries: true,
      fetchFailed: true,
    })).toEqual(salesOnly);
  });

  it("uses local attachments when fetch is not needed", () => {
    expect(resolveHomeDayAttachmentGroup({
      localGroup: salesOnly,
      fetchedGroup: null,
      shouldFetchDayEntries: false,
    })).toEqual(salesOnly);
  });
});
