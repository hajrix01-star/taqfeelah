import { describe, expect, it } from "vitest";
import {
  resolvePullToRefreshTarget,
  resolvePullToRefreshUsesNotebookSurface,
} from "./pull-to-refresh-policy";

describe("resolvePullToRefreshTarget", () => {
  it("enables closeouts refresh for employee main page", () => {
    expect(resolvePullToRefreshTarget({
      employee: true,
      ownerPage: "home",
      employeePage: "closeouts",
      employeeEntryActive: false,
      ownerEntryActive: false,
      ownerEditActive: false,
      hasActiveEmployee: true,
    })).toBe("closeouts");
  });

  it("disables employee refresh while entry flow is active", () => {
    expect(resolvePullToRefreshTarget({
      employee: true,
      ownerPage: "home",
      employeePage: "closeouts",
      employeeEntryActive: true,
      ownerEntryActive: false,
      ownerEditActive: false,
      hasActiveEmployee: true,
    })).toBeNull();
  });

  it("enables operational refresh on owner home, notebook, and register", () => {
    for (const ownerPage of ["home", "notebook", "register"]) {
      expect(resolvePullToRefreshTarget({
        employee: false,
        ownerPage,
        employeePage: "closeouts",
        employeeEntryActive: false,
        ownerEntryActive: false,
        ownerEditActive: false,
        hasActiveEmployee: false,
      })).toBe("operational-entries");
    }
  });

  it("enables closeouts refresh on owner closeouts page", () => {
    expect(resolvePullToRefreshTarget({
      employee: false,
      ownerPage: "closeouts",
      employeePage: "closeouts",
      employeeEntryActive: false,
      ownerEntryActive: false,
      ownerEditActive: false,
      hasActiveEmployee: false,
    })).toBe("closeouts");
  });

  it("disables refresh on owner settings and entry screens", () => {
    for (const ownerPage of ["settings", "add-summary", "add-expense"]) {
      expect(resolvePullToRefreshTarget({
        employee: false,
        ownerPage,
        employeePage: "closeouts",
        employeeEntryActive: false,
        ownerEntryActive: false,
        ownerEditActive: false,
        hasActiveEmployee: false,
      })).toBeNull();
    }
  });

  it("disables owner closeouts refresh while entry flow is active", () => {
    expect(resolvePullToRefreshTarget({
      employee: false,
      ownerPage: "closeouts",
      employeePage: "closeouts",
      employeeEntryActive: false,
      ownerEntryActive: true,
      ownerEditActive: false,
      hasActiveEmployee: false,
    })).toBeNull();
  });

  it("disables owner refresh while owner closeout edit is active", () => {
    expect(resolvePullToRefreshTarget({
      employee: false,
      ownerPage: "register",
      employeePage: "closeouts",
      employeeEntryActive: false,
      ownerEntryActive: false,
      ownerEditActive: true,
      hasActiveEmployee: false,
    })).toBeNull();
  });
});

describe("resolvePullToRefreshUsesNotebookSurface", () => {
  it("uses notebook surface on owner home, notebook, register, and closeouts", () => {
    for (const ownerPage of ["home", "notebook", "register", "closeouts"]) {
      expect(resolvePullToRefreshUsesNotebookSurface({
        employee: false,
        ownerPage,
        employeePage: "closeouts",
      })).toBe(true);
    }
  });

  it("uses shell surface on owner settings", () => {
    expect(resolvePullToRefreshUsesNotebookSurface({
      employee: false,
      ownerPage: "settings",
      employeePage: "closeouts",
    })).toBe(false);
  });

  it("uses notebook surface on employee closeouts page", () => {
    expect(resolvePullToRefreshUsesNotebookSurface({
      employee: true,
      ownerPage: "home",
      employeePage: "closeouts",
    })).toBe(true);
  });
});
