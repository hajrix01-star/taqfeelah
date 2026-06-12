import { describe, expect, it } from "vitest";
import { translations } from "@/features/saas-admin/i18n/translations";
import {
  formatCloseoutStatus,
  formatEntityStatus,
  formatMemberRole,
  formatOperationType,
  formatPlanCode,
} from "./admin-display-labels";

const t = translations.ar;

describe("admin-display-labels", () => {
  it("formats known plan codes in Arabic", () => {
    expect(formatPlanCode("trial", t)).toBe("تجربة");
    expect(formatPlanCode("starter", t)).toBe("أساسية");
    expect(formatPlanCode("growth", t)).toBe("نمو");
    expect(formatPlanCode("enterprise", t)).toBe("مؤسسات");
  });

  it("formats roles, statuses, and operation types in Arabic", () => {
    expect(formatMemberRole("manager", t)).toBe("مشرف");
    expect(formatEntityStatus("active", t)).toBe("نشط");
    expect(formatCloseoutStatus("approved", t)).toBe("معتمد");
    expect(formatOperationType("purchases", t)).toBe("مشتريات");
  });

  it("falls back to raw value for unknown codes", () => {
    expect(formatPlanCode("custom-plan", t)).toBe("custom-plan");
  });
});
