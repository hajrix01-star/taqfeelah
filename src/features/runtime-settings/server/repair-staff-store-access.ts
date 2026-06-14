import { isOrgConfigApiEnabled } from "@/core/config/org-config-api-mode";
import { buildRuntimeApiIdMaps } from "@/core/client/runtime-api-id-maps";
import { getProductionAuthRuntimeConfig } from "@/core/config/env";
import { enrichRuntimeStoreIdMap } from "@/features/runtime-settings/server/enrich-runtime-store-id-map";
import { getRuntimeSettingsByOrganizationId } from "@/features/runtime-settings/server/runtime-settings-service";
import { provisionStaffMembers } from "@/features/runtime-settings/server/provision-staff-members";

type RuntimeStaff = { id?: string; active?: boolean; removed?: boolean };
type RuntimeBusiness = { id?: string };

/**
 * Re-sync member_store_access for provisioned staff using runtime custom store IDs.
 * Safe to run on every deploy — idempotent.
 */
export async function repairStaffStoreAccess(organizationId: string) {
  if (isOrgConfigApiEnabled()) {
    return { staffCount: 0, activeStaffCount: 0, skipped: true };
  }

  const envelope = await getRuntimeSettingsByOrganizationId(organizationId);
  const settings = envelope?.settings && typeof envelope.settings === "object"
    ? envelope.settings as Record<string, unknown>
    : {};
  const staff = Array.isArray(settings.staff) ? settings.staff : [];
  const configuredBusinesses = Array.isArray(settings.configuredBusinesses)
    ? settings.configuredBusinesses
    : [];

  if (!staff.length) {
    return { staffCount: 0, activeStaffCount: 0 };
  }

  const envAuth = getProductionAuthRuntimeConfig();
  const enrichedStoreIdMap = await enrichRuntimeStoreIdMap(
    organizationId,
    envAuth.storeIdMap,
    configuredBusinesses as RuntimeBusiness[],
  );
  const runtimeApiMaps = buildRuntimeApiIdMaps({
    configuredBusinesses: configuredBusinesses as RuntimeBusiness[],
    staff: staff as RuntimeStaff[],
    envStoreIdMap: enrichedStoreIdMap,
    envUserIdMap: envAuth.userIdMap,
  });

  await provisionStaffMembers(organizationId, staff, {
    storeIdMap: runtimeApiMaps.storeIdMap,
    userIdMap: runtimeApiMaps.userIdMap,
  });

  const activeStaffCount = staff.filter(
    (person) => person && typeof person === "object"
      && (person as RuntimeStaff).active !== false
      && (person as RuntimeStaff).removed !== true,
  ).length;

  return { staffCount: staff.length, activeStaffCount };
}
