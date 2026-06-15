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
} from "./org-config-api-client.js";
import {
  isClientGeneratedId,
  mapApiChannelToUi,
  mapApiStoreToBusiness,
  mapApiMemberToStaff,
} from "./org-config-runtime-mapper.js";
import {
  resolveChannelPersistKind,
  resolveChannelPersistName,
} from "./owner-settings-channel-actions.js";

function resolveStoreUuid(business) {
  if (isUuid(business?.dbStoreId)) return business.dbStoreId;
  if (isUuid(business?.id)) return business.id;
  return "";
}

function channelApiId(channel) {
  if (isUuid(channel?.apiChannelId)) return channel.apiChannelId;
  if (isUuid(channel?.id)) return channel.id;
  return "";
}

function channelIsActive(channel, activeIds) {
  return Array.isArray(activeIds) && activeIds.includes(channel.id) && !channel.retired;
}

function cloneStoreChannelConfig(config = {}) {
  return {
    channels: (config.channels || []).map((channel) => ({ ...channel })),
    activeIds: [...(config.activeIds || [])],
  };
}

function remapChannelIdInConfig(config, oldId, createdChannel) {
  const mappedChannel = mapApiChannelToUi(createdChannel);
  return {
    channels: config.channels.map((channel) => (
      channel.id === oldId ? { ...channel, ...mappedChannel } : channel
    )),
    activeIds: config.activeIds.map((id) => (id === oldId ? mappedChannel.id : id)),
  };
}

function remapStoreChannelSettingsStoreKey(settings, oldStoreId, newStoreId) {
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
}) {
  const authArgs = {
    organizationId: auth.organizationId,
    actorUserId: auth.actorUserId,
    actorRole: auth.actorRole || "owner",
  };

  const baselineBusinessById = new Map((baseline.configuredBusinesses || []).map((item) => [item.id, item]));
  const nextBusinesses = next.configuredBusinesses || [];
  const remappedBusinesses = [...nextBusinesses];
  const remappedStaff = [...(next.staff || [])];

  for (let index = 0; index < remappedBusinesses.length; index += 1) {
    const business = remappedBusinesses[index];
    const previous = baselineBusinessById.get(business.id);
    const archivedNow = (next.archivedBusinessIds || []).includes(business.id);
    const archivedBefore = (baseline.archivedBusinessIds || []).includes(business.id);

    if (!previous && (isClientGeneratedId(business.id) || !resolveStoreUuid(business))) {
      const created = await createOrganizationStoreViaApi({
        ...authArgs,
        name: business.displayName || business.nameAr || business.nameEn || "Store",
        location: business.customLocation || "",
      });
      const mapped = mapApiStoreToBusiness({ ...created, legacyId: created.id });
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

    const nextName = business.displayName || business.nameAr || business.nameEn || "";
    const prevName = previous?.displayName || previous?.nameAr || previous?.nameEn || "";
    const nextLocation = business.customLocation || "";
    const prevLocation = previous?.customLocation || "";

    if (nextName !== prevName || nextLocation !== prevLocation) {
      await updateOrganizationStoreViaApi({
        ...authArgs,
        storeId: business.id,
        name: nextName,
        location: nextLocation,
      });
    }

    if (archivedNow !== archivedBefore) {
      await updateOrganizationStoreViaApi({
        ...authArgs,
        storeId: business.id,
        status: archivedNow ? "archived" : "active",
        reason: archivedNow ? "owner_archived_store" : "owner_restored_store",
      });
    }
  }

  let remappedStoreChannelSettings = Object.fromEntries(
    Object.entries(next.storeChannelSettings || {}).map(([storeId, config]) => [
      storeId,
      cloneStoreChannelConfig(config),
    ]),
  );

  remappedBusinesses.forEach((business, index) => {
    const previous = baselineBusinessById.get(nextBusinesses[index]?.id);
    const previousId = previous?.id || nextBusinesses[index]?.id;
    if (previousId && business.id !== previousId) {
      remappedStoreChannelSettings = remapStoreChannelSettingsStoreKey(
        remappedStoreChannelSettings,
        previousId,
        business.id,
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
    const beforeById = new Map((beforeConfig.channels || []).map((channel) => [channel.id, channel]));

    for (const afterChannel of afterConfig.channels || []) {
      const apiId = channelApiId(afterChannel);
      if (apiId) continue;

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
      });
      afterConfig = remapChannelIdInConfig(afterConfig, afterChannel.id, created);
      remappedStoreChannelSettings[storeId] = afterConfig;
    }

    const afterById = new Map((afterConfig.channels || []).map((channel) => [channel.id, channel]));
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

  const baselineStaffById = new Map((baseline.staff || []).map((person) => [person.id, person]));
  for (let index = 0; index < remappedStaff.length; index += 1) {
    const person = remappedStaff[index];
    const previous = baselineStaffById.get(person.id);
    const draftPin = typeof employeePins[person.id] === "string" ? employeePins[person.id].trim() : "";

    if (!previous?.memberId && (isClientGeneratedId(person.id) || !isUuid(person.memberId))) {
      const pin = draftPin || (typeof person.pin === "string" ? person.pin.trim() : "");
      if (!pin) {
        throw new Error("employee pin is required when creating a team member");
      }
      const created = await createOrganizationMemberViaApi({
        ...authArgs,
        name: person.nameAr || person.nameEn || "Employee",
        role: "employee",
        storeIds: person.storeIds || [],
        pin,
        loginPhone: person.mobile?.trim() || undefined,
      });
      const mapped = mapApiMemberToStaff({
        memberId: created.memberId,
        userId: created.userId,
        name: created.name,
        role: created.role,
        status: created.status,
        legacyStaffId: created.userId,
        storeAccess: (created.storeIds || []).map((storeId) => ({
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

    const nextName = person.nameAr || person.nameEn || "";
    const prevName = previous?.nameAr || previous?.nameEn || "";
    const nextMobile = (person.mobile || "").trim();
    const prevMobile = (previous?.mobile || "").trim();
    const nextStoreIds = [...(person.storeIds || [])].sort().join("|");
    const prevStoreIds = [...(previous?.storeIds || [])].sort().join("|");
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
        memberId,
        name: nextName,
        status: nextActive ? "active" : "inactive",
        storeIds: person.storeIds || [],
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
