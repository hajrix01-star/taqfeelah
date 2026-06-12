import { describe, expect, it } from "vitest";
import { resolveOwnerUserIdByEmail } from "@/features/auth/server/resolve-owner-by-email";

describe("resolveOwnerUserIdByEmail", () => {
  it("rejects non-email identifiers", async () => {
    await expect(resolveOwnerUserIdByEmail("owner")).resolves.toBeNull();
    await expect(resolveOwnerUserIdByEmail("")).resolves.toBeNull();
  });
});
