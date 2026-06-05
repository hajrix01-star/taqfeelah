import { describe, expect, it } from "vitest";
import {
  enrichStaffWithApiUserIds,
  resolveEmployeeUserId,
} from "@/features/auth/server/resolve-employee-user-id";

const userIdMap = {
  ahmed: "4cf1450d-08d8-4ca1-b180-1c2642174a79",
  sara: "85f696d6-f655-4f2d-9f56-1f13c2f4c66c",
};

describe("resolveEmployeeUserId", () => {
  it("maps legacy employee ids from env map", () => {
    expect(resolveEmployeeUserId("ahmed", userIdMap, null)).toBe(userIdMap.ahmed);
  });

  it("uses apiUserId from runtime staff settings", () => {
    const settings = {
      staff: [{ id: "staff-1", apiUserId: userIdMap.sara, nameEn: "Sara" }],
    };
    expect(resolveEmployeeUserId("staff-1", userIdMap, settings)).toBe(userIdMap.sara);
  });

  it("maps runtime staff legacy ids through env map", () => {
    const settings = {
      staff: [{ id: "ahmed", nameEn: "Ahmed" }],
    };
    expect(resolveEmployeeUserId("ahmed", userIdMap, settings)).toBe(userIdMap.ahmed);
  });
});

describe("enrichStaffWithApiUserIds", () => {
  it("adds apiUserId for known legacy staff ids", () => {
    const enriched = enrichStaffWithApiUserIds(
      [{ id: "ahmed", nameEn: "Ahmed" }],
      userIdMap,
    ) as Array<{ id: string; apiUserId?: string }>;
    expect(enriched[0]?.apiUserId).toBe(userIdMap.ahmed);
  });
});
