import { beforeEach, describe, expect, it, vi } from "vitest";

const selectMock = vi.fn();

vi.mock("@/core/db/client", () => ({
  getDb: () => ({
    select: selectMock,
  }),
}));

function mockStoreLookup(storeRow: { id: string; status: string } | undefined) {
  selectMock.mockReturnValueOnce({
    from: () => ({
      where: () => ({
        limit: async () => (storeRow ? [storeRow] : []),
      }),
    }),
  });
}

function mockMembership(role: string, storePermission = true) {
  selectMock.mockReturnValueOnce({
    from: () => ({
      where: () => ({
        limit: async () => [{ id: "member-1", role }],
      }),
    }),
  });

  if (role === "employee") {
    selectMock.mockReturnValueOnce({
      from: () => ({
        where: () => ({
          limit: async () => (storePermission ? [{ storeId: "store-1" }] : []),
        }),
      }),
    });
  }
}

describe("assertStoreAccess", () => {
  beforeEach(() => {
    selectMock.mockReset();
  });

  it("allows owners to read archived stores", async () => {
    const { assertStoreAccess } = await import("./assert-store-access");
    mockStoreLookup({ id: "store-1", status: "archived" });
    mockMembership("owner");

    await expect(assertStoreAccess({
      organizationId: "org-1",
      storeId: "store-1",
      actorUserId: "user-1",
      actorRole: "owner",
      scope: "read",
    })).resolves.toBeUndefined();
  });

  it("blocks writes to archived stores", async () => {
    const { assertStoreAccess } = await import("./assert-store-access");
    mockStoreLookup({ id: "store-1", status: "archived" });
    mockMembership("owner");

    await expect(assertStoreAccess({
      organizationId: "org-1",
      storeId: "store-1",
      actorUserId: "user-1",
      actorRole: "owner",
      scope: "write",
    })).rejects.toThrow("Archived stores cannot accept new entries.");
  });

  it("blocks employees from archived store reads", async () => {
    const { assertStoreAccess } = await import("./assert-store-access");
    mockStoreLookup({ id: "store-1", status: "archived" });
    mockMembership("employee");

    await expect(assertStoreAccess({
      organizationId: "org-1",
      storeId: "store-1",
      actorUserId: "user-1",
      actorRole: "employee",
      scope: "read",
    })).rejects.toThrow("Employee has no access to this store.");
  });
});
