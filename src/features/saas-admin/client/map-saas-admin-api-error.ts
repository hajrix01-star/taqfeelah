import type { SaasAdminTranslations } from "@/features/saas-admin/i18n/translations";

const ERROR_MESSAGE_MAP: Record<string, keyof SaasAdminTranslations["apiErrors"]> = {
  "Owner member was not found for this organization.": "ownerNotFound",
  "Active owner member was not found for this organization.": "ownerNotFound",
  "Owner username is already taken.": "ownerUsernameTaken",
  "Owner password is required when creating login credentials.": "ownerPasswordRequired",
  "Owner username is required when setting credentials.": "ownerUsernameRequired",
  "Member was not found for this organization.": "memberNotFound",
  "Subscription was not found for this organization.": "subscriptionNotFound",
  "At least one field must be provided to update.": "noChanges",
  "At least one owner field must be provided to update.": "noChanges",
};

export function mapSaasAdminApiError(message: string, t: SaasAdminTranslations): string {
  const key = ERROR_MESSAGE_MAP[message];
  return key ? t.apiErrors[key] : message;
}
