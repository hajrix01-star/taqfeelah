import {
  DEFAULT_NEW_STORE_INCOME_SOURCE_IDS,
} from "@/core/client/sales-channel-catalog";

type DefaultChannel = {
  id: string;
  text: string;
  retired: false;
};

export function buildDefaultStoreChannelSettings(storeId: string) {
  const channels: DefaultChannel[] = DEFAULT_NEW_STORE_INCOME_SOURCE_IDS.map((id) => ({
    id,
    text: id,
    retired: false,
  }));

  return {
    [storeId]: {
      channels,
      activeIds: [...DEFAULT_NEW_STORE_INCOME_SOURCE_IDS],
    },
  };
}
