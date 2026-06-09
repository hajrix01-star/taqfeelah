import { mapOrgConfigBundleToRuntime } from "../src/features/org-config/client/org-config-runtime-mapper.js";
import { isUuid } from "../src/core/client/api-id-utils.js";

const ORG = "8f63cf87-f2e2-4e2a-a20e-e8f637f0a9e1";
const OWNER = "e8f3e35b-6051-4da3-8b10-979700c2f00f";
const headers = {
  "x-organization-id": ORG,
  "x-user-id": OWNER,
  "x-member-role": "owner",
};

const storeMap = JSON.parse(process.env.NEXT_PUBLIC_CLOSEOUTS_STORE_ID_MAP || "{}");
const channelMap = JSON.parse(process.env.NEXT_PUBLIC_CLOSEOUTS_SALES_CHANNEL_ID_MAP || "{}");

console.log("invalid channel map entries:");
for (const [key, value] of Object.entries(channelMap)) {
  if (!isUuid(value)) console.log(" ", key, "->", value);
}

const storesPayload = await fetch("http://localhost:3000/api/v1/stores?status=all", { headers }).then((r) => r.json());
const stores = (storesPayload.stores || []).map((store) => ({
  ...store,
  legacyId: Object.entries(storeMap).find(([, uuid]) => uuid === store.id)?.[0] || store.id,
}));

const channelsByStoreId = {};
for (const store of stores) {
  const res = await fetch(
    `http://localhost:3000/api/v1/stores/${store.id}/sales-channels?status=all`,
    { headers },
  );
  const payload = await res.json();
  const channels = (payload.channels || []).map((channel) => ({
    ...channel,
    legacyId: Object.entries(channelMap).find(([, uuid]) => uuid === channel.id)?.[0] || channel.id,
  }));
  channelsByStoreId[store.id] = channels;
  for (const channel of channels) {
    if (!isUuid(channel.id)) {
      console.log("bad api channel id:", channel);
    }
  }
}

try {
  const mapped = mapOrgConfigBundleToRuntime({ stores, channelsByStoreId, members: [] });
  console.log("mapped ok", mapped.configuredBusinesses[0]?.displayName, "channels", mapped.storeChannelSettings);
} catch (error) {
  console.error("map failed:", error.message);
}
