import { describe, expect, it } from "vitest";
import {
  buildNewStaffMember,
  canAddStaffMember,
  cloneStaffDraft,
  prepareSavedTeamDraft,
  toggleEmployeeActiveInDraft,
  toggleEmployeeStoreInDraft,
  toggleStoreSelection,
} from "./owner-settings-team-actions";

describe("owner settings team actions", () => {
  it("clones staff draft without shared store ids", () => {
    const draft = cloneStaffDraft([{ id: "ahmed", storeIds: ["shami"] }]);
    draft[0].storeIds?.push("arz");

    expect([{ id: "ahmed", storeIds: ["shami"] }][0].storeIds).toEqual(["shami"]);
  });

  it("prepares saved team draft with normalized pins", () => {
    const result = prepareSavedTeamDraft(
      [{ id: "ahmed", pin: "1111" }, { id: "sara" }],
      {
        draftAuthEmployeePins: { sara: "2222" },
        authEmployeePins: { old: "0000" },
      },
    );

    expect(result.staff[0].pin).toBe("1111");
    expect(result.staff[1].pin).toBe("2222");
    expect(result.employeePins).toEqual({ sara: "2222" });
  });

  it("validates add staff prerequisites", () => {
    expect(canAddStaffMember({ name: "Ali", storeIds: ["shami"], managingTeam: true })).toBe(true);
    expect(canAddStaffMember({ name: "", storeIds: ["shami"], managingTeam: true })).toBe(false);
  });

  it("builds new staff member and toggles draft state", () => {
    const created = buildNewStaffMember({
      id: "staff-test",
      name: " Ali ",
      mobile: "0500000000",
      storeIds: ["shami"],
      defaultPin: "4321",
    });

    expect(created.member.nameAr).toBe("Ali");
    expect(created.employeePinsPatch).toEqual({ "staff-test": "4321" });

    const toggled = toggleEmployeeActiveInDraft(
      [{ id: "ahmed", active: true }],
      "ahmed",
    );
    expect(toggled[0].active).toBe(false);

    const reassigned = toggleEmployeeStoreInDraft(
      [{ id: "ahmed", storeIds: ["shami"] }],
      "ahmed",
      "arz",
    );
    expect(reassigned[0].storeIds).toEqual(["shami", "arz"]);
    expect(toggleStoreSelection(["shami"], "arz")).toEqual(["shami", "arz"]);
  });
});
