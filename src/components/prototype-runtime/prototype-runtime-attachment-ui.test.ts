import { describe, expect, it } from "vitest";
import { mergeAttachmentApiContext } from "./prototype-runtime-attachment-ui";

describe("mergeAttachmentApiContext", () => {
  it("merges storeId into provided attachment api context", () => {
    expect(mergeAttachmentApiContext({
      attachmentsApiEnabled: true,
      organizationId: "8f63cf87-f2e2-4e2a-a20e-e8f637f0a9e1",
      actorUserId: "e8f3e35b-6051-4da3-8b10-979700c2f00f",
      actorRole: "owner",
    }, "302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c")).toEqual({
      attachmentsApiEnabled: true,
      organizationId: "8f63cf87-f2e2-4e2a-a20e-e8f637f0a9e1",
      actorUserId: "e8f3e35b-6051-4da3-8b10-979700c2f00f",
      actorRole: "owner",
      storeId: "302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c",
    });
  });

  it("returns storeId-only context when no base context is provided", () => {
    expect(mergeAttachmentApiContext(null, "shami")).toEqual({ storeId: "shami" });
  });
});
