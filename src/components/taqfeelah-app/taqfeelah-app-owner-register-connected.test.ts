import { describe, expect, it } from "vitest";
import { buildOwnerRegisterForwardedApiProps } from "./taqfeelah-app-owner-register-connected";

describe("buildOwnerRegisterForwardedApiProps", () => {
  it("forwards the complete authenticated register API context", () => {
    expect(buildOwnerRegisterForwardedApiProps({
      registerEntriesApiEnabled: true,
      registerEntriesApiOrganizationId: "organization-1",
      registerEntriesApiActorUserId: "owner-1",
      registerEntriesApiActorRole: "owner",
    })).toEqual({
      registerEntriesApiEnabled: true,
      registerEntriesApiOrganizationId: "organization-1",
      registerEntriesApiActorUserId: "owner-1",
      registerEntriesApiActorRole: "owner",
    });
  });
});
