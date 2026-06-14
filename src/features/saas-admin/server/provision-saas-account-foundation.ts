import { getDb } from "@/core/db/client";
import { auditEvents } from "@/core/db/schema";
import { buildDefaultStoreChannelSettings } from "@/features/org-config/server/build-default-store-channel-settings";
import { provisionSalesChannels } from "@/features/runtime-settings/server/provision-sales-channels";

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
