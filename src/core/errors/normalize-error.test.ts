import { describe, expect, it } from "vitest";
import { ValidationError } from "@/core/errors/app-error";
import { ERROR_CODES } from "@/core/errors/error-codes";
import { catalogAppError, getPublicErrorPayload, normalizeError } from "@/core/errors/normalize-error";

describe("normalizeError", () => {
  it("maps known validation messages to stable error codes", () => {
    const normalized = normalizeError(new ValidationError("Owner username is already taken."));
    expect(normalized.code).toBe(ERROR_CODES.OWNER_USERNAME_TAKEN);
    expect(normalized.status).toBe(409);
  });

  it("maps postgres unique username violations", () => {
    const normalized = normalizeError({
      code: "23505",
      constraint: "auth_identities_username_password_uq",
      detail: "Key (provider, username)=(username_password, acme) already exists.",
    });

    expect(normalized.code).toBe(ERROR_CODES.OWNER_USERNAME_TAKEN);
    expect(normalized.message).toContain("already taken");
  });

  it("maps postgres foreign key violations to provisioning dependency errors", () => {
    const normalized = normalizeError({
      code: "23503",
      detail: 'Key (organization_id)=(...) is not present in table "organizations".',
    });

    expect(normalized.code).toBe(ERROR_CODES.PROVISION_DEPENDENCY_MISSING);
  });

  it("returns internal error payload with cause for unknown failures", () => {
    const normalized = normalizeError(new Error("boom"));
    const payload = getPublicErrorPayload(normalized);

    expect(payload.code).toBe(ERROR_CODES.INTERNAL_ERROR);
    expect(payload.cause).toBeTruthy();
    expect(payload.type).toContain("taqfeelah.com/errors");
  });

  it("builds catalog errors with stable metadata", () => {
    const error = catalogAppError(ERROR_CODES.INVALID_STORE_IDS);
    const payload = getPublicErrorPayload(error);

    expect(payload.title).toBe("Invalid store selection");
    expect(payload.message).toContain("storeIds");
  });
});
