import { PROTOTYPE_SALES_CHANNEL_IDS } from "@/core/client/sales-channel-catalog";
import { getDb } from "@/core/db/client";
import { auditEvents } from "@/core/db/schema";
import { provisionSalesChannels } from "@/features/runtime-settings/server/provision-sales-channels";

function buildDefaultStoreChannelSettings(storeId: string) {
  const channels = PROTOTYPE_SALES_CHANNEL_IDS.map((id) => ({
    id,
    text: id,
    retired: false,
  }));
  return {
    [storeId]: {
      channels,
      activeIds: [...PROTOTYPE_SALES_CHANNEL_IDS],
    },
  };
}

type ProvisionSaasAccountFoundationInput = {
  organizationId: string;
  actorUserId: string;
  ownerUserId: string;
  ownerName: string;
  storeId: string;
  storeName: string;
};

export async function provisionSaasAccountFoundation(
  input: ProvisionSaasAccountFoundationInput,
  executor: Pick<ReturnType<typeof getDb>, "insert" | "select" | "update">,
) {
  const storeChannelSettings = await provisionSalesChannels(
    input.organizationId,
    buildDefaultStoreChannelSettings(input.storeId),
    {
      storeIdMap: { [input.storeId]: input.storeId },
      salesChannelIdMap: {},
      executor,
    },
  );

  const settings = {
    ownerProfile: {
      name: input.ownerName.trim(),
    },
    notebookTheme: "yellow",
    employeePreferences: {},
    ownerShellPreferences: {},
    storeOperationalSettings: {
      [input.storeId]: {},
    },
    authConfig: {
      ownerUsername: "",
      ownerPassword: "",
      employeePins: {},
    },
  };

  await executor.insert(auditEvents).values({
    organizationId: input.organizationId,
    actorUserId: input.actorUserId,
    action: "runtime_settings_saved",
    reason: "saas_account_provisioned",
    metadata: {
      settings: {
        ...settings,
        storeChannelSettings,
        provisionedStoreName: input.storeName,
        provisionedOwnerUserId: input.ownerUserId,
      },
      schemaVersion: 1,
    },
  });

  return settings;
}
