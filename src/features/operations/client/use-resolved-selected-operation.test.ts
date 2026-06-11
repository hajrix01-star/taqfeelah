import { describe, expect, it } from "vitest";
import { resolveSelectedOperation } from "./use-resolved-selected-operation";

describe("resolveSelectedOperation", () => {
  it("returns the freshest entry when catalogs contain a newer snapshot", () => {
    const stale = { id: "e1", enteredBy: { userId: "employee-1", nameAr: "أحمد" } };
    const fresh = { id: "e1", enteredBy: { userId: "owner-1", role: "owner", nameAr: "" } };

    expect(resolveSelectedOperation(stale, [[fresh]])).toEqual(fresh);
  });

  it("keeps the selected snapshot when no catalog contains the id", () => {
    const selected = { id: "e1", enteredBy: { userId: "employee-1" } };

    expect(resolveSelectedOperation(selected, [[]])).toEqual(selected);
  });
});
