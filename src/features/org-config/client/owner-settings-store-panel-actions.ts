import { cloneStoreChannelDraft } from "./owner-settings-channel-actions";
import { cloneStoreOperationalDraft } from "./owner-settings-operational-actions";
import { buildStoreProfileDraft } from "./owner-settings-store-actions";
import type { StoreChannelConfig, StoreOperationalDraft } from "./org-config-client-types";

export function resolveStorePanelOpenDrafts(
  panel: string,
  {
    selectedStore,
    displayBusinessName,
    displayLocation,
    savedChannelConfig,
    savedOperationalConfig,
  }: {
    selectedStore: Record<string, unknown> | null | undefined;
    displayBusinessName: (store: Record<string, unknown>) => string;
    displayLocation: (store: Record<string, unknown>) => string;
    savedChannelConfig: StoreChannelConfig;
    savedOperationalConfig: StoreOperationalDraft;
  },
) {
  if (panel === "profile") {
    return {
      profile: buildStoreProfileDraft(selectedStore, {
        displayName: selectedStore ? displayBusinessName(selectedStore) : "",
        location: selectedStore ? displayLocation(selectedStore) : "",
      }),
    };
  }

  if (panel === "channels") {
    return { channelConfig: cloneStoreChannelDraft(savedChannelConfig) };
  }

  if (panel === "expenses" || panel === "alerts" || panel === "review") {
    return { operationalConfig: cloneStoreOperationalDraft(savedOperationalConfig) };
  }

  return {};
}

export function resolveStoreFlattenedOpenDrafts({
  selectedStore,
  displayBusinessName,
  displayLocation,
  savedChannelConfig,
  savedOperationalConfig,
}: {
  selectedStore: Record<string, unknown> | null | undefined;
  displayBusinessName: (store: Record<string, unknown>) => string;
  displayLocation: (store: Record<string, unknown>) => string;
  savedChannelConfig: StoreChannelConfig;
  savedOperationalConfig: StoreOperationalDraft;
}) {
  return {
    profile: buildStoreProfileDraft(selectedStore, {
      displayName: selectedStore ? displayBusinessName(selectedStore) : "",
      location: selectedStore ? displayLocation(selectedStore) : "",
    }),
    channelConfig: cloneStoreChannelDraft(savedChannelConfig),
    operationalConfig: cloneStoreOperationalDraft(savedOperationalConfig),
  };
}
