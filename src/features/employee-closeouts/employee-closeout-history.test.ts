import { describe, expect, it } from "vitest";
import { setRuntimeApiIdMaps } from "../closeouts/client/closeouts-api-client";
import {
  closeoutBelongsToEmployee,
  closeoutMatchesStore,
  storeIdsReferToSameStore,
} from "./employee-closeout-history";

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

  it("matches API uuid closeout rows to legacy staff id via runtime user map", () => {
    setRuntimeApiIdMaps({
      userIdMap: {
        "staff-1780679715016": "acb24f1e-bf77-48d7-ba01-1e77d2c8c713",
      },
    });

    expect(closeoutBelongsToEmployee(
      {
        openedByUserId: "acb24f1e-bf77-48d7-ba01-1e77d2c8c713",
        submittedByUserId: "acb24f1e-bf77-48d7-ba01-1e77d2c8c713",
      },
      {
        id: "staff-1780679715016",
        nameAr: "AHMED",
        nameEn: "AHMED",
      },
    )).toBe(true);

    setRuntimeApiIdMaps(null);
  });
});

describe("storeIdsReferToSameStore", () => {
  it("matches legacy store id with hydrated UUID via runtime map", () => {
    setRuntimeApiIdMaps({
      storeIdMap: {
        shami: "302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c",
      },
    });

    expect(storeIdsReferToSameStore("shami", "302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c")).toBe(true);
    expect(storeIdsReferToSameStore("302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c", "shami")).toBe(true);

    setRuntimeApiIdMaps(null);
  });
});

describe("closeoutMatchesStore", () => {
  it("matches closeout legacy store id against hydrated business record", () => {
    setRuntimeApiIdMaps({
      storeIdMap: {
        shami: "302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c",
      },
    });

    const business = {
      id: "302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c",
      dbStoreId: "302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c",
      legacyId: "shami",
    };

    expect(closeoutMatchesStore({ storeId: "shami" }, business)).toBe(true);
    expect(closeoutMatchesStore({ storeId: "302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c" }, business)).toBe(true);

    setRuntimeApiIdMaps(null);
  });
});
