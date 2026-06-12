import { describe, expect, it } from "vitest";
import {
  SaasAdminApiError,
  mapSaasAdminApiError,
  mapSaasAdminApiErrorDetails,
  resolveSaasAdminFormError,
} from "@/features/saas-admin/client/api-error";
import { translations } from "@/features/saas-admin/i18n/translations";

describe("saas admin api error mapping", () => {
  it("maps stable API codes to Arabic messages", () => {
    const error = new SaasAdminApiError(
      {
        code: "OWNER_USERNAME_TAKEN",
        message: "Owner username is already taken.",
        cause: "auth_identities already contains this username for provider username_password.",
      },
      409,
    );

    expect(mapSaasAdminApiError(error, translations.ar)).toBe(
      translations.ar.apiErrors.ownerUsernameTaken,
    );
  });

  it("maps owner phone taken with conflicting organization", () => {
    const details = mapSaasAdminApiErrorDetails(
      new SaasAdminApiError(
        {
          code: "OWNER_PHONE_TAKEN",
          message: "Owner login phone is already assigned to another account.",
          cause: 'Owner login phone is already assigned to organization "Active Org".',
          details: {
            conflictingOrganizationName: "Active Org",
            conflictingOrganizationStatus: "active",
          } as never,
        },
        409,
      ),
      translations.ar,
    );

    expect(details.message).toBe(translations.ar.apiErrors.ownerPhoneTaken);
    expect(details.cause).toContain("Active Org");
  });

  it("returns message and cause for form display", () => {
    const resolved = resolveSaasAdminFormError(
      new SaasAdminApiError(
        {
          code: "PROVISION_DEPENDENCY_MISSING",
          message: "Account provisioning failed because foundation data was not ready.",
          cause: "A provisioning step referenced organization/store rows outside the active transaction.",
        },
        409,
      ),
      translations.ar,
      "fallback",
    );

    expect(resolved.code).toBe("PROVISION_DEPENDENCY_MISSING");
    expect(resolved.message).toBe(translations.ar.apiErrors.provisionDependencyMissing);
    expect(resolved.cause).toBeTruthy();
  });
});
