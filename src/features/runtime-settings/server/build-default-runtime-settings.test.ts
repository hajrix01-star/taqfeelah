import { describe, expect, it, vi } from "vitest";

vi.mock("@/core/db/client", () => ({
  getDb: () => ({
    select: () => ({
      from: () => ({
        innerJoin: () => ({
          where: () => ({
            orderBy: () => ({
              limit: async () => [{ name: "Tenant Owner" }],
            }),
          }),
        }),
      }),
    }),
  }),
}));

describe("buildDefaultRuntimeSettingsForOrganization", () => {
  it("uses the organization owner name from the database", async () => {
    const { buildDefaultRuntimeSettingsForOrganization } = await import("./build-default-runtime-settings");
    const settings = await buildDefaultRuntimeSettingsForOrganization(
      "11111111-1111-4111-8111-111111111111",
    );
    expect(settings.ownerProfile).toEqual({ name: "Tenant Owner" });
  });
});
