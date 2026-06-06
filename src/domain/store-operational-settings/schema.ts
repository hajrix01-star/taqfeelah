import { z } from "zod";
import { DEFAULT_EXPENSE_CATEGORY_IDS } from "@/domain/store-operational-settings/types";

const storeOperationalSettingsFieldSchemas = {
  activeCategories: z.array(z.string().trim().min(1)),
  reviewEnabled: z.boolean(),
  closeoutReviewEnabled: z.boolean(),
  employeeHistoryVisibility: z.enum(["week", "month", "all"]),
  closeoutAlert: z.boolean(),
  attachmentAlert: z.boolean(),
  notebookTheme: z.string().trim().min(1).nullable(),
};

export const storeOperationalSettingsSchema = z.object({
  activeCategories: storeOperationalSettingsFieldSchemas.activeCategories.default([...DEFAULT_EXPENSE_CATEGORY_IDS]),
  reviewEnabled: storeOperationalSettingsFieldSchemas.reviewEnabled.default(false),
  closeoutReviewEnabled: storeOperationalSettingsFieldSchemas.closeoutReviewEnabled.default(false),
  employeeHistoryVisibility: storeOperationalSettingsFieldSchemas.employeeHistoryVisibility.default("all"),
  closeoutAlert: storeOperationalSettingsFieldSchemas.closeoutAlert.default(false),
  attachmentAlert: storeOperationalSettingsFieldSchemas.attachmentAlert.default(false),
  notebookTheme: storeOperationalSettingsFieldSchemas.notebookTheme.default(null),
});

export const storeOperationalSettingsPatchSchema = z.object({
  activeCategories: storeOperationalSettingsFieldSchemas.activeCategories.optional(),
  reviewEnabled: storeOperationalSettingsFieldSchemas.reviewEnabled.optional(),
  closeoutReviewEnabled: storeOperationalSettingsFieldSchemas.closeoutReviewEnabled.optional(),
  employeeHistoryVisibility: storeOperationalSettingsFieldSchemas.employeeHistoryVisibility.optional(),
  closeoutAlert: storeOperationalSettingsFieldSchemas.closeoutAlert.optional(),
  attachmentAlert: storeOperationalSettingsFieldSchemas.attachmentAlert.optional(),
  notebookTheme: storeOperationalSettingsFieldSchemas.notebookTheme.optional(),
});

export type StoreOperationalSettingsInput = z.infer<typeof storeOperationalSettingsSchema>;
export type StoreOperationalSettingsPatch = z.infer<typeof storeOperationalSettingsPatchSchema>;
