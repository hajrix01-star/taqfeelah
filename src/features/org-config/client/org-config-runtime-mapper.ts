import { CreditCard, Landmark, ShoppingBag, Smartphone, Wallet } from "lucide-react";
import { INCOME_SOURCE_CATALOG, getCatalogEntry } from "@/core/client/income-source-catalog";
import { normalizeStoreOperationalSettings } from "@/domain/store-operational-settings/normalize";
import { isUuid } from "@/features/closeouts/client/closeouts-api-client";
import type {
  ApiChannelRow,
  ApiMemberRow,
  ApiStoreRow,
  OrgConfigBundleInput,
  OrgConfigRuntimeSnapshot,
  StoreChannelConfig,
} from "./org-config-client-types";

const emptyStoreRecord = { sales: 0, expense: 0, ratio: "0.0%", net: 0, proofs: 0 };

export function assertCanonicalUuidId(entityName: string, value: unknown) {
  if (!isUuid(value)) {
    throw new Error(`${entityName} id must be a canonical UUID in DB source mode.`);
  }
}

function catalogIcon(legacyId: string, kind: string) {
  if (legacyId === "cash") return Wallet;
  if (legacyId === "bank") return Landmark;
  if (legacyId === "apple") return Smartphone;
  if (kind === "sales_channel") return ShoppingBag;
  return CreditCard;
}

const CHANNEL_TEMPLATES: Record<string, Record<string, unknown>> = Object.fromEntries(
  INCOME_SOURCE_CATALOG.map((entry) => [
    entry.legacyId,
    {
      id: entry.legacyId,
      text: entry.legacyId,
      kind: entry.kind,
      icon: catalogIcon(entry.legacyId, entry.kind),
    },
  ]),
);

const CHANNEL_NAME_TO_LEGACY: Record<string, string> = Object.fromEntries(
  INCOME_SOURCE_CATALOG.flatMap((entry) => [
    [entry.legacyId.toLowerCase(), entry.legacyId],
    [entry.nameEn.trim().toLowerCase(), entry.legacyId],
    [entry.nameAr.trim().toLowerCase(), entry.legacyId],
  ]),
);

function normalizeChannelName(name: unknown) {
  return typeof name === "string" ? name.trim().toLowerCase() : "";
}

export function resolveChannelLegacyId(channel: ApiChannelRow) {
  if (channel?.legacyId && !isUuid(channel.legacyId)) return channel.legacyId;
  const byName = CHANNEL_NAME_TO_LEGACY[normalizeChannelName(channel?.name)];
  if (byName) return byName;
  if (typeof channel?.id === "string" && !isUuid(channel.id)) return channel.id;
  return typeof channel?.id === "string" ? channel.id : "";
}

export function mapApiChannelToUi(channel: ApiChannelRow) {
  const legacyId = resolveChannelLegacyId(channel);
  const template = CHANNEL_TEMPLATES[legacyId];
  const retired = channel?.status === "retired";
  const deleted = Boolean(channel?.deleted || channel?.deletedAt);
  assertCanonicalUuidId("sales channel", channel?.id);
  if (template) {
    const catalogEntry = getCatalogEntry(legacyId);
    return {
      ...template,
      id: channel.id,
      legacyId,
      apiChannelId: channel.id,
      nameAr: catalogEntry?.nameAr,
      nameEn: catalogEntry?.nameEn,
      retired,
      deleted,
    };
  }
  const label = typeof channel?.name === "string" ? channel.name.trim() : legacyId;
  const kind = channel?.kind === "sales_channel" || channel?.kind === "payment_method"
    ? channel.kind
    : "payment_method";
  return {
    id: channel.id,
    legacyId,
    apiChannelId: channel.id,
    custom: true,
    kind,
    nameAr: label,
    nameEn: label,
    icon: kind === "sales_channel" ? ShoppingBag : CreditCard,
    retired,
    deleted,
  };
}

export function mapApiStoreToBusiness(store: ApiStoreRow) {
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

export function mapApiMemberToStaff(
  member: ApiMemberRow,
  { employeePins = {} }: { employeePins?: Record<string, string> } = {},
) {
  const deleted = Boolean(member?.deleted || member?.deletedAt);
  const storeIds = (
    member?.storeAccess?.length
      ? member.storeAccess.map((row) => row.storeId)
      : member?.storeIds || []
  )
    .map((storeId) => String(storeId || ""))
    .filter(Boolean);
  const memberId = member?.memberId || "";
  const userId = member?.userId || "";
  assertCanonicalUuidId("staff", userId);
  const legacyStaffId = member?.legacyStaffId || userId || memberId;
  const draftPin = employeePins[legacyStaffId] || employeePins[userId] || employeePins[memberId] || "";
  const pin = draftPin || (member?.pinConfigured ? "" : "");
  return {
    id: userId || legacyStaffId,
    legacyId: legacyStaffId && legacyStaffId !== userId ? legacyStaffId : "",
    memberId,
    apiUserId: userId,
    nameAr: member?.name || "",
    nameEn: member?.name || "",
    mobile: member?.loginPhone || member?.mobile || "",
    active: member?.status === "active" && !deleted,
    removed: false,
    deleted,
    deletedAt: member?.deletedAt || null,
    status: member?.status || "active",
    storeIds,
    pin,
    pinConfigured: Boolean(member?.pinConfigured),
    role: member?.role || "employee",
  };
}

export function mapEmployeeStoresBundleToRuntime({
  stores = [],
  channelsByStoreId = {},
}: Pick<OrgConfigBundleInput, "stores" | "channelsByStoreId">) {
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
}: OrgConfigBundleInput = {}): OrgConfigRuntimeSnapshot {
  const configuredBusinesses: Array<Record<string, unknown>> = [];
  const archivedBusinessIds: string[] = [];

  stores.forEach((store) => {
    const business = mapApiStoreToBusiness(store);
    if (store.status === "archived") {
      archivedBusinessIds.push(String(business.id));
    }
    configuredBusinesses.push(business);
  });

  const storeChannelSettings: Record<string, StoreChannelConfig> = {};
  configuredBusinesses.forEach((business) => {
    const storeUuid = String(business.dbStoreId || business.id || "");
    const channelRows = channelsByStoreId[storeUuid] || channelsByStoreId[String(business.id || "")] || [];
    const channels = channelRows.map((row) => mapApiChannelToUi(row)).filter((channel) => !channel.deleted);
    storeChannelSettings[String(business.id || "")] = {
      channels,
      activeIds: channels.filter((channel) => !channel.retired).map((channel) => String(channel.id || "")),
    };
  });

  const staff = members
    .filter((member) => member.role === "employee" && !member?.deleted && !member?.deletedAt)
    .map((member) => mapApiMemberToStaff(member, { employeePins }));

  const storeOperationalSettings: Record<string, unknown> = {};
  const storesByUuid = new Map(stores.map((store) => [String(store.id || ""), store]));
  configuredBusinesses.forEach((business) => {
    const storeRow = storesByUuid.get(String(business.dbStoreId || "")) || storesByUuid.get(String(business.id || ""));
    if (storeRow?.operationalSettings) {
      storeOperationalSettings[String(business.id || "")] = normalizeStoreOperationalSettings(storeRow.operationalSettings);
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
export function validateOrgConfigDbChannelMappings(
  mapped: Pick<OrgConfigRuntimeSnapshot, "storeChannelSettings"> | null | undefined,
  { strict = false }: { strict?: boolean } = {},
) {
  if (!strict || !mapped || typeof mapped !== "object") return;
  const settings = mapped.storeChannelSettings || {};
  for (const [storeId, config] of Object.entries(settings)) {
    const activeIds = Array.isArray(config?.activeIds) ? config.activeIds : [];
    for (const channel of config?.channels || []) {
      if (!activeIds.includes(String(channel?.id || "")) || channel?.retired) continue;
      if (!isUuid(channel?.apiChannelId)) {
        const label = channel?.nameAr || channel?.nameEn || channel?.id || storeId;
        throw new Error(`sales channel id must be a canonical UUID in DB source mode (${label}).`);
      }
    }
  }
}

/** Pending UI ids before org-config API create calls resolve them to UUIDs. */
export function isClientGeneratedId(id: unknown) {
  return typeof id === "string" && (
    id.startsWith("custom-")
    || id.startsWith("staff-")
    || id.startsWith("channel-")
  );
}

export function buildOrgConfigPersistBaseline(snapshot: OrgConfigRuntimeSnapshot) {
  (snapshot.configuredBusinesses || []).forEach((business) => {
    if (!isClientGeneratedId(business.id)) {
      assertCanonicalUuidId("store", business.id);
    }
  });
  (snapshot.staff || []).forEach((person) => {
    if (!isClientGeneratedId(person.id)) {
      assertCanonicalUuidId("staff", person.id);
    }
    (person.storeIds as string[] | undefined || []).forEach((storeId) => {
      if (!isClientGeneratedId(storeId)) {
        assertCanonicalUuidId("staff store", storeId);
      }
    });
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
      deleted: Boolean(person.deleted || person.deletedAt),
      storeIds: [...(person.storeIds as string[] | undefined || [])].sort(),
    })),
  });
}
