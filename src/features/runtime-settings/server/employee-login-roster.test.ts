import { describe, expect, it } from "vitest";
import { mapEmployeeLoginRosterRows } from "./runtime-settings-service";

describe("employee login roster mapping", () => {
  it("maps active DB employees back to legacy ids and store ids for the open login flow", () => {
    const roster = mapEmployeeLoginRosterRows({
      memberRows: [
        {
          memberId: "member-ahmed",
          userId: "4cf1450d-08d8-4ca1-b180-1c2642174a79",
          name: "Ahmed",
        },
        {
          memberId: "member-no-store",
          userId: "00000000-0000-4000-8000-000000000099",
          name: "No Store",
        },
      ],
      accessRows: [
        {
          memberId: "member-ahmed",
          storeId: "302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c",
        },
      ],
      userIdMap: {
        ahmed: "4cf1450d-08d8-4ca1-b180-1c2642174a79",
      },
      storeIdMap: {
        shami: "302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c",
      },
    });

    expect(roster).toEqual([
      {
        id: "ahmed",
        apiUserId: "4cf1450d-08d8-4ca1-b180-1c2642174a79",
        memberId: "member-ahmed",
        nameAr: "Ahmed",
        nameEn: "Ahmed",
        active: true,
        removed: false,
        storeIds: ["shami"],
      },
    ]);
  });
});
