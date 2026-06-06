import { describe, expect, it } from "vitest";
import { closeoutBelongsToEmployee } from "./employee-closeout-history";

describe("closeoutBelongsToEmployee", () => {
  const employee = {
    id: "staff-1780679715016",
    apiUserId: "acb24f1e-bf77-48d7-ba01-1e77d2c8c713",
    nameAr: "AHMED",
    nameEn: "AHMED",
  };

  it("matches legacy staff id on closeout actor fields", () => {
    expect(closeoutBelongsToEmployee(
      { openedByUserId: "staff-1780679715016", submittedByUserId: "staff-1780679715016" },
      employee,
    )).toBe(true);
  });

  it("matches provisioned apiUserId from API closeout rows", () => {
    expect(closeoutBelongsToEmployee(
      { openedByUserId: "acb24f1e-bf77-48d7-ba01-1e77d2c8c713", submittedByUserId: "acb24f1e-bf77-48d7-ba01-1e77d2c8c713" },
      employee,
    )).toBe(true);
  });

  it("falls back to normalized employee name", () => {
    expect(closeoutBelongsToEmployee(
      { openedByName: "Ahmed", submittedByName: "Ahmed" },
      employee,
    )).toBe(true);
  });
});
