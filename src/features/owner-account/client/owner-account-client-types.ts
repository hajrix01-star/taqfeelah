import type { DisplayLang } from "@/core/i18n/display-locale";
import type { RuntimeSettingsAuth } from "@/features/runtime-settings/client/runtime-settings-client-types";
import type { OwnerAccountSummary } from "@/features/billing/client/billing-client-types";

export type UseOwnerAccountSummaryProps = {
  enabled?: boolean;
  auth?: RuntimeSettingsAuth;
  lang?: DisplayLang;
};

export type { OwnerAccountSummary };
