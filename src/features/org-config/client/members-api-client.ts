/**
 * Canonical member APIs live in org-config-api-client.js.
 * This module keeps a stable import path for Phase 10 docs and future OTP/member flows.
 */
export {
  createOrganizationMemberViaApi,
  updateOrganizationMemberViaApi,
  setOrgConfigRuntimeApiIdMaps as setMembersRuntimeApiIdMaps,
} from "@/features/org-config/client/org-config-api-client";
