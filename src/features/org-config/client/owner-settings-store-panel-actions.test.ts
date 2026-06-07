import { describe, expect, it } from "vitest";
import { resolveStorePanelOpenDrafts } from "./owner-settings-store-panel-actions";

describe("owner settings store panel actions", () => {
  const selectedStore = { id: "shami", displayName: "Shami" };
  const displayBusinessName = () => "Shami Branch";
  const displayLocation = () => "Riyadh";

  it("opens profile drafts from selected store labels", () => {
    const drafts = resolveStorePanelOpenDrafts("profile", {
      selectedStore,
      displayBusinessName,
      displayLocation,
      savedChannelConfig: { channels: [], activeIds: [] },
      savedOperationalConfig: { activeCategories: ["rent"] },
    });

    expect(drafts.profile).toEqual({ name: "Shami", location: "Riyadh" });
  });

  it("clones channel and operational drafts for edit panels", () => {
    const channelDrafts = resolveStorePanelOpenDrafts("channels", {
      selectedStore,
      displayBusinessName,
      displayLocation,
      savedChannelConfig: { channels: [{ id: "cash" }], activeIds: ["cash"] },
      savedOperationalConfig: { activeCategories: ["rent"] },
    });
    const operationalDrafts = resolveStorePanelOpenDrafts("review", {
      selectedStore,
      displayBusinessName,
      displayLocation,
      savedChannelConfig: { channels: [], activeIds: [] },
      savedOperationalConfig: { activeCategories: ["rent", "salary"] },
    });

    channelDrafts.channelConfig?.activeIds.push("mada");
    operationalDrafts.operationalConfig?.activeCategories.push("utility");

    expect(channelDrafts.channelConfig?.activeIds).toEqual(["cash", "mada"]);
    expect(operationalDrafts.operationalConfig?.activeCategories).toEqual(["rent", "salary", "utility"]);
  });
});
