import { CreditCard, ShoppingBag, Smartphone, Wallet } from "lucide-react";
import { normalizeStoreOperationalSettings } from "@/domain/store-operational-settings/normalize";
import { isUuid } from "@/features/closeouts/client/closeouts-api-client";

const emptyStoreRecord = { sales: 0, expense: 0, ratio: "0.0%", net: 0, proofs: 0 };

export function assertCanonicalUuidId(entityName, value) {
  if (!isUuid(value)) {
    throw new Error(`${entityName} id must be a canonical UUID in DB source mode.`);
  }
}

const CHANNEL_TEMPLATES = {
  cash: { id: "cash", text: "cash", icon: Wallet },
  mada: { id: "mada", text: "mada", icon: CreditCard },
  apple: { id: "apple", text: "apple", icon: Smartphone },
  jahez: { id: "jahez", text: "jahez", icon: ShoppingBag },
  hunger: { id: "hunger", text: "hunger", icon: ShoppingBag },
  card: { id: "card", text: "card", icon: CreditCard },
  online: { id: "online", text: "online", icon: CreditCard },
};

const CHANNEL_NAME_TO_LEGACY = {
  cash: "cash",
  mada: "mada",
  "apple pay": "apple",
  jahez: "jahez",
  hungerstation: "hunger",
  card: "card",
  online: "online",
};

function normalizeChannelName(name) {
  return typeof name === "string" ? name.trim().toLowerCase() : "";
}

export function resolveChannelLegacyId(channel) {
  if (channel?.legacyId && !isUuid(channel.legacyId)) return channel.legacyId;
  const byName = CHANNEL_NAME_TO_LEGACY[normalizeChannelName(channel?.name)];
  if (byName) return byName;
  if (typeof channel?.id === "string" && !isUuid(channel.id)) return channel.id;
  return typeof channel?.id === "string" ? channel.id : "";
}

export function mapApiChannelToUi(channel) {
  const legacyId = resolveChannelLegacyId(channel);
  const template = CHANNEL_TEMPLATES[legacyId];
  const retired = channel?.status === "retired";
  assertCanonicalUuidId("sales channel", channel?.id);
  if (template) {
    return {
      ...template,
      id: channel.id,
      legacyId,
      apiChannelId: channel.id,
      retired,
    };
  }
  const label = typeof channel?.name === "string" ? channel.name.trim() : legacyId;
  return {
    id: channel.id,
    legacyId,
    apiChannelId: channel.id,
    custom: true,
    nameAr: label,
    nameEn: label,
    icon: CreditCard,
    retired,
  };
}

export function mapApiStoreToBusiness(store) {
  const legacyId = store?.legacyId && !isUuid(store.legacyId) ? store.legacyId : "";
  const name = typeof store?.name === "string" ? store.name.trim() : "";
  const id = isUuid(store?.id) ? store.id : legacyId || store?.id;
  assertCanonicalUuidId("store", id);
  return {
    id,
    dbStoreId: store.id,
    legacyId,
    displayName: name,
    nameAr: name,
    nameEn: name,
    customLocation: store?.location || "",
    day: { ...emptyStoreRecord },
    month: { ...emptyStoreRecord },
  };
}

export function mapApiMemberToStaff(member, { employeePins = {} } = {}) {
  const storeIds = (member?.storeAccess || [])
    .map((row) => row.storeId)
    .filter(Boolean);
  const memberId = member?.memberId || "";
  const userId = member?.userId || "";
  assertCanonicalUuidId("staff", userId);
  const legacyStaffId = member?.legacyStaffId || userId || memberId;
  const pin = employeePins[legacyStaffId] || employeePins[userId] || employeePins[memberId] || "1234";
  return {
    id: userId || legacyStaffId,
    legacyId: legacyStaffId && legacyStaffId !== userId ? legacyStaffId : "",
    memberId,
    apiUserId: userId,
    nameAr: member?.name || "",
    nameEn: member?.name || "",
    mobile: member?.mobile || "",
    active: member?.status === "active",
    removed: member?.status === "inactive",
    storeIds,
    pin,
    role: member?.role || "employee",
  };
}

export function mapEmployeeStoresBundleToRuntime({
  stores = [],
  channelsByStoreId = {},
}) {
  const mapped = mapOrgConfigBundleToRuntime({
    stores,
    channelsByStoreId,
    members: [],
    employeePins: {},
  });
  return {
    configuredBusinesses: mapped.configuredBusinesses,
    archivedBusinessIds: mapped.archivedBusinessIds,
    storeChannelSettings: mapped.storeChannelSettings,
    storeOperationalSettings: mapped.storeOperationalSettings,
  };
}

export function mapOrgConfigBundleToRuntime({
  stores = [],
  channelsByStoreId = {},
  members = [],
  employeePins = {},
}) {
  const configuredBusinesses = [];
  const archivedBusinessIds = [];

  stores.forEach((store) => {
    const business = mapApiStoreToBusiness(store);
    if (store.status === "archived") {
      archivedBusinessIds.push(business.id);
    }
    configuredBusinesses.push(business);
  });

  const storeChannelSettings = {};
  configuredBusinesses.forEach((business) => {
    const storeUuid = business.dbStoreId || business.id;
    const channelRows = channelsByStoreId[storeUuid] || channelsByStoreId[business.id] || [];
    const channels = channelRows.map((row) => mapApiChannelToUi(row));
    storeChannelSettings[business.id] = {
      channels,
      activeIds: channels.filter((channel) => !channel.retired).map((channel) => channel.id),
    };
  });

  const staff = members
    .filter((member) => member.role === "employee")
    .map((member) => mapApiMemberToStaff(member, { employeePins }));

  const storeOperationalSettings = {};
  const storesByUuid = new Map(stores.map((store) => [store.id, store]));
  configuredBusinesses.forEach((business) => {
    const storeRow = storesByUuid.get(business.dbStoreId) || storesByUuid.get(business.id);
    if (storeRow?.operationalSettings) {
      storeOperationalSettings[business.id] = normalizeStoreOperationalSettings(storeRow.operationalSettings);
    }
  });

  return {
    configuredBusinesses,
    archivedBusinessIds,
    storeChannelSettings,
    storeOperationalSettings,
    staff,
  };
}

/** Ensure active sales channels loaded from DB APIs carry canonical UUID apiChannelId values. */
export function validateOrgConfigDbChannelMappings(mapped, { strict = false } = {}) {
  if (!strict || !mapped || typeof mapped !== "object") return;
  const settings = mapped.storeChannelSettings || {};
  for (const [storeId, config] of Object.entries(settings)) {
    const activeIds = Array.isArray(config?.activeIds) ? config.activeIds : [];
    for (const channel of config?.channels || []) {
      if (!activeIds.includes(channel?.id) || channel?.retired) continue;
      if (!isUuid(channel?.apiChannelId)) {
        const label = channel?.nameAr || channel?.nameEn || channel?.id || storeId;
        throw new Error(`sales channel id must be a canonical UUID in DB source mode (${label}).`);
      }
    }
  }
}

export function buildOrgConfigPersistBaseline(snapshot) {
  (snapshot.configuredBusinesses || []).forEach((business) => {
    assertCanonicalUuidId("store", business.id);
  });
  (snapshot.staff || []).forEach((person) => {
    assertCanonicalUuidId("staff", person.id);
    (person.storeIds || []).forEach((storeId) => assertCanonicalUuidId("staff store", storeId));
  });
  return JSON.stringify({
    businesses: (snapshot.configuredBusinesses || []).map((business) => ({
      id: business.id,
      dbStoreId: business.dbStoreId || "",
      legacyId: business.legacyId || "",
      displayName: business.displayName || business.nameAr || business.nameEn || "",
      customLocation: business.customLocation || "",
    })),
    archivedBusinessIds: [...(snapshot.archivedBusinessIds || [])].sort(),
    storeChannelSettings: snapshot.storeChannelSettings || {},
    storeOperationalSettings: snapshot.storeOperationalSettings || {},
    staff: (snapshot.staff || []).map((person) => ({
      id: person.id,
      legacyId: person.legacyId || "",
      memberId: person.memberId || "",
      apiUserId: person.apiUserId || "",
      nameAr: person.nameAr || "",
      nameEn: person.nameEn || "",
      mobile: person.mobile || "",
      active: Boolean(person.active),
      removed: Boolean(person.removed),
      storeIds: [...(person.storeIds || [])].sort(),
    })),
  });
}
