import { cloneStoreChannelDraft } from "./owner-settings-channel-actions";
import { cloneStoreOperationalDraft } from "./owner-settings-operational-actions";
import { buildStoreProfileDraft } from "./owner-settings-store-actions";

/**
 * @param {string} panel
 * @param {Object} input
 * @param {Record<string, unknown> | null | undefined} input.selectedStore
 * @param {(store: Record<string, unknown>) => string} input.displayBusinessName
 * @param {(store: Record<string, unknown>) => string} input.displayLocation
 * @param {Record<string, unknown>} input.savedChannelConfig
 * @param {Record<string, unknown>} input.savedOperationalConfig
 */
export function resolveStorePanelOpenDrafts(panel, {
  selectedStore,
  displayBusinessName,
  displayLocation,
  savedChannelConfig,
  savedOperationalConfig,
}) {
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

  if (panel === "expenses" || panel === "review") {
    return { operationalConfig: cloneStoreOperationalDraft(savedOperationalConfig) };
  }

  return {};
}
