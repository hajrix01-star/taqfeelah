import { beforeEach, describe, expect, it, vi } from "vitest";

const selectMock = vi.fn();
const updateMock = vi.fn(() => ({ where: vi.fn() }));
const insertMock = vi.fn(() => ({ values: vi.fn() }));

vi.mock("@/core/db/client", () => ({
  getDb: () => ({
    select: selectMock,
    update: updateMock,
    insert: insertMock,
  }),
}));

function mockSelectChain(rows: unknown[]) {
  const limit = vi.fn().mockResolvedValue(rows);
  const orderBy = vi.fn(() => ({ limit }));
  const where = vi.fn(() => ({ limit, orderBy }));
  const from = vi.fn(() => ({ where }));
  selectMock.mockReturnValueOnce({ from });
  return { limit, where, from, orderBy };
}

describe("ensureOwnerLoginPhoneAvailable", () => {
  beforeEach(() => {
    selectMock.mockReset();
    updateMock.mockReset();
    insertMock.mockReset();
  });

  it("allows the same owner to keep their phone", async () => {
    mockSelectChain([
      {
        identityId: "identity-1",
        userId: "user-1",
        username: "+966552210049",
      },
    ]);
    mockSelectChain([
      {
        organizationId: "org-1",
        ownerMemberStatus: "active",
      },
    ]);
    mockSelectChain([
      {
        organizationName: "Test Org",
        organizationStatus: "active",
      },
    ]);

    const { ensureOwnerLoginPhoneAvailable } = await import("./owner-login-phone-availability");

    await expect(
      ensureOwnerLoginPhoneAvailable(
        {
          phone: "+966552210049",
          excludeUserId: "user-1",
          targetOrganizationId: "org-1",
          actorUserId: "admin-1",
        },
        {
          select: selectMock,
          update: updateMock,
          insert: insertMock,
        } as never,
      ),
    ).resolves.toBeUndefined();

    expect(updateMock).not.toHaveBeenCalled();
  });

  it("releases login phone from an archived organization", async () => {
    mockSelectChain([
      {
        identityId: "identity-archived",
        userId: "user-archived",
        username: "+966552210049",
      },
    ]);
    mockSelectChain([
      {
        organizationId: "org-archived",
        ownerMemberStatus: "active",
      },
    ]);
    mockSelectChain([
      {
        organizationName: "Old Test",
        organizationStatus: "archived",
      },
    ]);

    const where = vi.fn().mockResolvedValue(undefined);
    updateMock.mockReturnValueOnce({ set: vi.fn(() => ({ where })) } as never);
    insertMock.mockReturnValueOnce({ values: vi.fn().mockResolvedValue(undefined) });

    const { ensureOwnerLoginPhoneAvailable } = await import("./owner-login-phone-availability");

    await ensureOwnerLoginPhoneAvailable(
      {
        phone: "+966552210049",
        excludeUserId: null,
        targetOrganizationId: "org-new",
        actorUserId: "admin-1",
      },
      {
        select: selectMock,
        update: updateMock,
        insert: insertMock,
      } as never,
    );

    expect(updateMock).toHaveBeenCalledOnce();
    expect(insertMock).toHaveBeenCalledOnce();
  });

  it("rejects active accounts that already own the phone", async () => {
    mockSelectChain([
      {
        identityId: "identity-2",
        userId: "user-2",
        username: "+966552210049",
      },
    ]);
    mockSelectChain([
      {
        organizationId: "org-2",
        ownerMemberStatus: "active",
      },
    ]);
    mockSelectChain([
      {
        organizationName: "Active Org",
        organizationStatus: "active",
      },
    ]);

    const { ensureOwnerLoginPhoneAvailable } = await import("./owner-login-phone-availability");

    await expect(
      ensureOwnerLoginPhoneAvailable(
        {
          phone: "+966552210049",
          excludeUserId: "user-1",
          targetOrganizationId: "org-1",
          actorUserId: "admin-1",
        },
        {
          select: selectMock,
          update: updateMock,
          insert: insertMock,
        } as never,
      ),
    ).rejects.toMatchObject({
      code: "OWNER_PHONE_TAKEN",
    });
  });
});
