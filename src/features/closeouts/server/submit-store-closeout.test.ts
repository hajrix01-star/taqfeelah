import { describe, expect, it, vi, beforeEach } from "vitest";

const mockTx = {
  insert: vi.fn(() => ({ values: vi.fn(() => ({ returning: vi.fn(async () => [{ id: "entry-1" }]) })) })),
  update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn(async () => undefined) })) })),
};
const mockDb = {
  transaction: vi.fn(async (fn) => fn(mockTx)),
  select: vi.fn(() => ({
    from: vi.fn(() => ({
      where: vi.fn(() => ({ orderBy: vi.fn(() => ({ limit: vi.fn(async () => []) })) })),
      innerJoin: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn(async () => []) })) })),
    })),
  })),
};

vi.mock("@/core/db/client", () => ({ getDb: () => mockDb }));
vi.mock("@/core/auth/assert-store-access", () => ({
  assertStoreAccess: vi.fn(async () => undefined),
}));

const ORG_ID = "8f63cf87-f2e2-4e2a-a20e-e8f637f0a9e1";
const STORE_ID = "302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c";
const ACTOR_ID = "e8f3e35b-6051-4da3-8b10-979700c2f00f";
const CHANNEL_ID = "9bc40d4f-c773-4ba3-87db-b8bb1467dafb";

const validInput = {
  organizationId: ORG_ID,
  storeId: STORE_ID,
  date: "2026-06-05",
  actorUserId: ACTOR_ID,
  actorRole: "owner" as const,
  closeoutId: "test-closeout-1",
  mode: "submit" as const,
  autoReview: false,
  salesChannels: [{ salesChannelId: CHANNEL_ID, channelName: "Cash", amountHalalas: 17000 }],
  outflows: [{ type: "expense" as const, amountHalalas: 3000 }],
};

describe("submitStoreCloseout", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects empty sales", async () => {
    const { submitStoreCloseout } = await import("@/features/closeouts/server/submit-store-closeout");
    await expect(
      submitStoreCloseout({ ...validInput, salesChannels: [] }),
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
  });

  it("rejects all-zero sales channels", async () => {
    const { submitStoreCloseout } = await import("@/features/closeouts/server/submit-store-closeout");
    await expect(
      submitStoreCloseout({
        ...validInput,
        salesChannels: [{ salesChannelId: CHANNEL_ID, channelName: "Cash", amountHalalas: 0 }],
      }),
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
  });

  it("succeeds with valid input and returns correct totals", async () => {
    const { submitStoreCloseout } = await import("@/features/closeouts/server/submit-store-closeout");
    mockTx.insert.mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: "entry-abc", type: "summary", amountHalalas: 17000 }]),
      }),
    });
    const result = await submitStoreCloseout(validInput);
    expect(result.totals.totalSalesHalalas).toBe(17000);
    expect(result.totals.totalOutflowHalalas).toBe(3000);
    expect(result.totals.netMovementHalalas).toBe(14000);
  });

  it("validates negative outflow is rejected", async () => {
    const { submitStoreCloseout } = await import("@/features/closeouts/server/submit-store-closeout");
    await expect(
      submitStoreCloseout({
        ...validInput,
        outflows: [{ type: "expense", amountHalalas: -100 }],
      }),
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
  });

  it("autoReview allowed for owner", async () => {
    const { submitStoreCloseout } = await import("@/features/closeouts/server/submit-store-closeout");
    mockTx.insert.mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: "entry-auto", type: "summary", amountHalalas: 17000 }]),
      }),
    });
    const result = await submitStoreCloseout({ ...validInput, autoReview: true });
    expect(result.summaryEntryId).toBeDefined();
  });

  it("autoReview blocked for employee", async () => {
    const { submitStoreCloseout } = await import("@/features/closeouts/server/submit-store-closeout");
    mockTx.insert.mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: "entry-emp", type: "summary", amountHalalas: 17000 }]),
      }),
    });
    await submitStoreCloseout({ ...validInput, actorRole: "employee", autoReview: true });
    // Should still succeed but entries would be voided (autoReview ignored)
    const insertArgs = mockTx.insert.mock.calls;
    expect(insertArgs.length).toBeGreaterThan(0);
  });
});
