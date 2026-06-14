import { describe, expect, it } from "vitest";
import {
  canAddEmployeeSeat,
  canAddStore,
  countEmployeeSeats,
} from "@/features/billing/client/entitlement-guards";

const entitlements = {
  maxStores: 1,
  maxEmployees: 3,
  usage: {
    activeStores: 1,
    activeEmployees: 2,
    pendingInvitations: 1,
  },
};

describe("entitlement-guards", () => {
  it("counts employee seats including pending invitations", () => {
    expect(countEmployeeSeats(entitlements.usage)).toBe(3);
  });

  it("blocks store creation at the store limit", () => {
    expect(canAddStore(entitlements)).toBe(false);
  });

  it("blocks employee invites at the seat limit", () => {
    expect(canAddEmployeeSeat(entitlements)).toBe(false);
  });

  it("allows actions when entitlements are not loaded yet", () => {
    expect(canAddStore(null)).toBe(true);
    expect(canAddEmployeeSeat(null)).toBe(true);
  });
});
