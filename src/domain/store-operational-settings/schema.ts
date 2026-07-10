import { z } from "zod";
import { DEFAULT_EXPENSE_CATEGORY_IDS } from "@/domain/store-operational-settings/types";

const storeOperationalSettingsFieldSchemas = {
  activeCategories: z.array(z.string().trim().min(1)),
  employeeHistoryVisibility: z.enum(["week", "month", "all"]),
  closeoutAlert: z.boolean(),
  notebookTheme: z.string().trim().min(1).nullable(),
  dailySalesTarget: z.number().finite().nonnegative().nullable(),
};

export const storeOperationalSettingsSchema = z.object({
  activeCategories: storeOperationalSettingsFieldSchemas.activeCategories.default([...DEFAULT_EXPENSE_CATEGORY_IDS]),
  employeeHistoryVisibility: storeOperationalSettingsFieldSchemas.employeeHistoryVisibility.default("month"),
  closeoutAlert: storeOperationalSettingsFieldSchemas.closeoutAlert.default(false),
  notebookTheme: storeOperationalSettingsFieldSchemas.notebookTheme.default(null),
  dailySalesTarget: storeOperationalSettingsFieldSchemas.dailySalesTarget.default(null),
});

export const storeOperationalSettingsPatchSchema = z.object({
  activeCategories: storeOperationalSettingsFieldSchemas.activeCategories.optional(),
  employeeHistoryVisibility: storeOperationalSettingsFieldSchemas.employeeHistoryVisibility.optional(),
  closeoutAlert: storeOperationalSettingsFieldSchemas.closeoutAlert.optional(),
  notebookTheme: storeOperationalSettingsFieldSchemas.notebookTheme.optional(),
  dailySalesTarget: storeOperationalSettingsFieldSchemas.dailySalesTarget.optional(),
});

export type StoreOperationalSettingsInput = z.infer<typeof storeOperationalSettingsSchema>;
export type StoreOperationalSettingsPatch = z.infer<typeof storeOperationalSettingsPatchSchema>;
