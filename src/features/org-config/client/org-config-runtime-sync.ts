import { diffStoreOperationalSettingsPatch } from "@/domain/store-operational-settings/normalize";
import { isUuid } from "@/features/closeouts/client/closeouts-api-client";
import {
  createOrganizationMemberViaApi,
  createOrganizationStoreViaApi,
  createStoreSalesChannelViaApi,
  updateOrganizationMemberViaApi,
  updateOrganizationStoreViaApi,
  updateStoreOperationalSettingsViaApi,
  updateStoreSalesChannelViaApi,
} from "./org-config-api-client";
import {
  isClientGeneratedId,
  mapApiChannelToUi,
  mapApiStoreToBusiness,
  mapApiMemberToStaff,
} from "./org-config-runtime-mapper";
import {
  resolveChannelPersistKind,
  resolveChannelPersistName,
} from "./owner-settings-channel-actions";
import type {
  OrgConfigApiAuth,
  OrgConfigRuntimeSnapshot,
  StoreChannelConfig,
} from "./org-config-client-types";

function resolveStoreUuid(business: Record<string, unknown>) {
  if (isUuid(business?.dbStoreId)) return String(business.dbStoreId);
  if (isUuid(business?.id)) return String(business.id);
  return "";
}

function channelApiId(channel: Record<string, unknown>) {
  if (isUuid(channel?.apiChannelId)) return String(channel.apiChannelId);
  if (isUuid(channel?.id)) return String(channel.id);
  return "";
}

function normalizeChannelKey(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function channelLegacyKey(channel: Record<string, unknown>) {
  const byLegacy = normalizeChannelKey(channel?.legacyId);
  if (byLegacy) return byLegacy;

  const byText = normalizeChannelKey(channel?.text);
  if (byText) return byText;

  const byId = normalizeChannelKey(channel?.id);
  if (byId && !isUuid(byId)) return byId;

  return "";
}

function channelNameKey(channel: Record<string, unknown>) {
  return normalizeChannelKey(channel?.nameAr || channel?.nameEn || channel?.name);
}

function channelsSemanticallyMatch(a: Record<string, unknown>, b: Record<string, unknown>) {
  const aLegacy = channelLegacyKey(a);
  const bLegacy = channelLegacyKey(b);
  if (aLegacy && bLegacy && aLegacy === bLegacy) return true;

  const aName = channelNameKey(a);
  const bName = channelNameKey(b);
  return Boolean(aName && bName && aName === bName);
}

function channelIsActive(channel: Record<string, unknown>, activeIds: string[]) {
  return Array.isArray(activeIds) && activeIds.includes(String(channel.id)) && !channel.retired;
}

function cloneStoreChannelConfig(config: StoreChannelConfig = { channels: [], activeIds: [] }): StoreChannelConfig {
  return {
    channels: (config.channels || []).map((channel) => ({ ...channel })),
    activeIds: [...(config.activeIds || [])],
  };
}

function remapChannelIdInConfig(
  config: StoreChannelConfig,
  oldId: string,
  createdChannel: Record<string, unknown>,
): StoreChannelConfig {
  const mappedChannel = mapApiChannelToUi(createdChannel);
  const nextChannels = config.channels.map((channel) => (
    channel.id === oldId ? { ...channel, ...mappedChannel } : channel
  ));
  const dedupedChannels = Array.from(new Map(
    nextChannels.map((channel) => [String(channel.id || ""), channel]),
  ).values());
  const dedupedActiveIds = Array.from(new Set(
    config.activeIds.map((id) => (id === oldId ? String(mappedChannel.id || "") : id)).filter(Boolean),
  ));

  return {
    channels: dedupedChannels,
    activeIds: dedupedActiveIds,
  };
}

function remapStoreChannelSettingsStoreKey(
  settings: Record<string, StoreChannelConfig>,
  oldStoreId: string,
  newStoreId: string,
) {
  if (!oldStoreId || !newStoreId || oldStoreId === newStoreId) return settings;
  if (!settings[oldStoreId]) return settings;
  const next = { ...settings };
  next[newStoreId] = next[oldStoreId];
  delete next[oldStoreId];
  return next;
}

export async function persistOrgConfigSnapshot({
  auth,
  baseline,
  next,
  employeePins = {},
}: {
  auth: OrgConfigApiAuth;
  baseline: OrgConfigRuntimeSnapshot;
  next: OrgConfigRuntimeSnapshot;
  employeePins?: Record<string, string>;
}) {
  const authArgs = {
    organizationId: auth.organizationId,
    actorUserId: auth.actorUserId,
    actorRole: auth.actorRole || "owner",
  };

  const baselineBusinessById = new Map((baseline.configuredBusinesses || []).map((item) => [String(item.id), item]));
  const nextBusinesses = next.configuredBusinesses || [];
  const remappedBusinesses = [...nextBusinesses];
  const remappedStaff = [...(next.staff || [])];

  for (let index = 0; index < remappedBusinesses.length; index += 1) {
    const business = remappedBusinesses[index];
    const previous = baselineBusinessById.get(String(business.id));
    const archivedNow = (next.archivedBusinessIds || []).includes(String(business.id));
    const archivedBefore = (baseline.archivedBusinessIds || []).includes(String(business.id));

    if (!previous && (isClientGeneratedId(business.id) || !resolveStoreUuid(business))) {
      const created = await createOrganizationStoreViaApi({
        ...authArgs,
        name: String(business.displayName || business.nameAr || business.nameEn || "Store"),
        location: String(business.customLocation || ""),
      }) as Record<string, unknown>;
      const mapped = mapApiStoreToBusiness({ ...created, legacyId: created.id as string });
      remappedBusinesses[index] = {
        ...business,
        ...mapped,
        id: mapped.id,
        dbStoreId: created.id,
      };
      continue;
    }

    const storeUuid = resolveStoreUuid(business);
    if (!storeUuid) continue;

    const nextName = String(business.displayName || business.nameAr || business.nameEn || "");
    const prevName = String(previous?.displayName || previous?.nameAr || previous?.nameEn || "");
    const nextLocation = String(business.customLocation || "");
    const prevLocation = String(previous?.customLocation || "");

    if (nextName !== prevName || nextLocation !== prevLocation) {
      await updateOrganizationStoreViaApi({
        ...authArgs,
        storeId: String(business.id),
        name: nextName,
        location: nextLocation,
      });
    }

    if (archivedNow !== archivedBefore) {
      await updateOrganizationStoreViaApi({
        ...authArgs,
        storeId: String(business.id),
        status: archivedNow ? "archived" : "active",
        reason: archivedNow ? "owner_archived_store" : "owner_restored_store",
      });
    }
  }

  let remappedStoreChannelSettings: Record<string, StoreChannelConfig> = Object.fromEntries(
    Object.entries(next.storeChannelSettings || {}).map(([storeId, config]) => [
      storeId,
      cloneStoreChannelConfig(config),
    ]),
  );

  remappedBusinesses.forEach((business, index) => {
    const previous = baselineBusinessById.get(String(nextBusinesses[index]?.id));
    const previousId = previous?.id || nextBusinesses[index]?.id;
    if (previousId && business.id !== previousId) {
      remappedStoreChannelSettings = remapStoreChannelSettingsStoreKey(
        remappedStoreChannelSettings,
        String(previousId),
        String(business.id),
      );
    }
  });

  const baselineChannels = baseline.storeChannelSettings || {};
  const storeIds = new Set([
    ...Object.keys(baselineChannels),
    ...Object.keys(remappedStoreChannelSettings),
  ]);

  for (const storeId of storeIds) {
    const beforeConfig = baselineChannels[storeId] || { channels: [], activeIds: [] };
    let afterConfig = remappedStoreChannelSettings[storeId] || { channels: [], activeIds: [] };
    const beforeById = new Map((beforeConfig.channels || []).map((channel) => [String(channel.id), channel]));

    for (const afterChannel of afterConfig.channels || []) {
      const apiId = channelApiId(afterChannel);
      if (apiId) continue;

      const matchedExisting = (beforeConfig.channels || []).find((beforeChannel) => (
        Boolean(channelApiId(beforeChannel))
        && channelsSemanticallyMatch(beforeChannel, afterChannel)
      ));
      if (matchedExisting) {
        afterConfig = remapChannelIdInConfig(afterConfig, String(afterChannel.id), matchedExisting);
        remappedStoreChannelSettings[storeId] = afterConfig;
        continue;
      }

      const name = resolveChannelPersistName(afterChannel, "ar");
      if (!name) continue;

      const isActive = channelIsActive(afterChannel, afterConfig.activeIds);
      const created = await createStoreSalesChannelViaApi({
        ...authArgs,
        storeId,
        name,
        kind: resolveChannelPersistKind(afterChannel),
        status: isActive ? "active" : "retired",
        reason: "owner_added_channel",
      }) as Record<string, unknown>;
      afterConfig = remapChannelIdInConfig(afterConfig, String(afterChannel.id), created);
      remappedStoreChannelSettings[storeId] = afterConfig;
    }

    const afterById = new Map((afterConfig.channels || []).map((channel) => [String(channel.id), channel]));
    const channelIds = new Set([...beforeById.keys(), ...afterById.keys()]);

    for (const channelId of channelIds) {
      const beforeChannel = beforeById.get(channelId);
      const afterChannel = afterById.get(channelId);
      if (!afterChannel || !beforeChannel) continue;

      const apiId = channelApiId(afterChannel) || channelApiId(beforeChannel);
      if (!apiId) continue;

      const wasActive = beforeChannel ? channelIsActive(beforeChannel, beforeConfig.activeIds) : false;
      const isActive = channelIsActive(afterChannel, afterConfig.activeIds);
      if (wasActive === isActive && Boolean(beforeChannel?.retired) === Boolean(afterChannel?.retired)) continue;

      await updateStoreSalesChannelViaApi({
        ...authArgs,
        storeId,
        salesChannelId: apiId,
        status: isActive ? "active" : "retired",
        reason: isActive ? "owner_activated_channel" : "owner_retired_channel",
      });
    }
  }

  const baselineStaffById = new Map((baseline.staff || []).map((person) => [String(person.id), person]));
  for (let index = 0; index < remappedStaff.length; index += 1) {
    const person = remappedStaff[index];
    const previous = baselineStaffById.get(String(person.id));
    const draftPin = typeof employeePins[String(person.id)] === "string" ? employeePins[String(person.id)].trim() : "";

    if (!previous?.memberId && (isClientGeneratedId(person.id) || !isUuid(person.memberId))) {
      const pin = draftPin || (typeof person.pin === "string" ? person.pin.trim() : "");
      if (!pin) {
        throw new Error("employee pin is required when creating a team member");
      }
      const created = await createOrganizationMemberViaApi({
        ...authArgs,
        name: String(person.nameAr || person.nameEn || "Employee"),
        role: "employee",
        storeIds: (person.storeIds as string[] | undefined) || [],
        pin,
        loginPhone: typeof person.mobile === "string" ? person.mobile.trim() || undefined : undefined,
      }) as Record<string, unknown>;
      const mapped = mapApiMemberToStaff({
        memberId: created.memberId as string,
        userId: created.userId as string,
        name: created.name as string,
        role: created.role as string,
        status: created.status as string,
        legacyStaffId: created.userId as string,
        storeAccess: ((created.storeIds as string[] | undefined) || []).map((storeId) => ({
          storeId,
          legacyStoreId: storeId,
        })),
      }, { employeePins });
      remappedStaff[index] = {
        ...person,
        ...mapped,
        pin,
      };
      continue;
    }

    const memberId = person.memberId || previous?.memberId;
    if (!isUuid(memberId)) continue;

    const nextName = String(person.nameAr || person.nameEn || "");
    const prevName = String(previous?.nameAr || previous?.nameEn || "");
    const nextMobile = String(person.mobile || "").trim();
    const prevMobile = String(previous?.mobile || "").trim();
    const nextStoreIds = [...((person.storeIds as string[] | undefined) || [])].sort().join("|");
    const prevStoreIds = [...((previous?.storeIds as string[] | undefined) || [])].sort().join("|");
    const nextActive = Boolean(person.active) && !person.removed;
    const prevActive = Boolean(previous?.active) && !previous?.removed;

    if (
      nextName !== prevName
      || nextMobile !== prevMobile
      || nextStoreIds !== prevStoreIds
      || nextActive !== prevActive
      || Boolean(draftPin)
    ) {
      await updateOrganizationMemberViaApi({
        ...authArgs,
        memberId: String(memberId),
        name: nextName,
        status: nextActive ? "active" : "inactive",
        storeIds: (person.storeIds as string[] | undefined) || [],
        ...(draftPin ? { pin: draftPin } : {}),
        loginPhone: nextMobile || undefined,
        reason: nextActive ? "owner_updated_member" : "owner_removed_member",
      });
    }
  }

  const baselineOperational = baseline.storeOperationalSettings || {};
  const nextOperational = next.storeOperationalSettings || {};
  const operationalStoreIds = new Set([
    ...Object.keys(baselineOperational),
    ...Object.keys(nextOperational),
  ]);

  for (const storeId of operationalStoreIds) {
    const beforeSettings = baselineOperational[storeId];
    const afterSettings = nextOperational[storeId];
    if (!afterSettings) continue;

    const patch = diffStoreOperationalSettingsPatch(beforeSettings, afterSettings);
    if (!Object.keys(patch).length) continue;

    await updateStoreOperationalSettingsViaApi({
      ...authArgs,
      storeId,
      patch,
      reason: "owner_updated_operational_settings",
    });
  }

  return {
    configuredBusinesses: remappedBusinesses,
    archivedBusinessIds: next.archivedBusinessIds || [],
    storeChannelSettings: remappedStoreChannelSettings,
    storeOperationalSettings: next.storeOperationalSettings || {},
    staff: remappedStaff,
  };
}
