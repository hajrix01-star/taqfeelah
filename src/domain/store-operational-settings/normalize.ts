import {
  storeOperationalSettingsPatchSchema,
  storeOperationalSettingsSchema,
} from "@/domain/store-operational-settings/schema";
import type { StoreOperationalSettings } from "@/domain/store-operational-settings/types";
import type { StoreOperationalSettingsPatch } from "@/domain/store-operational-settings/schema";

export function defaultStoreOperationalSettings(): StoreOperationalSettings {
  return storeOperationalSettingsSchema.parse({});
}

export function normalizeStoreOperationalSettings(
  raw: unknown,
): StoreOperationalSettings {
  const parsed = storeOperationalSettingsSchema.safeParse(raw ?? {});
  if (parsed.success) return parsed.data;
  return defaultStoreOperationalSettings();
}

export function mergeStoreOperationalSettings(
  current: unknown,
  patch: unknown,
): StoreOperationalSettings {
  const base = normalizeStoreOperationalSettings(current);
  const parsedPatch = storeOperationalSettingsPatchSchema.safeParse(patch ?? {});
  if (!parsedPatch.success) {
    return base;
  }
  const patchValues = Object.fromEntries(
    Object.entries(parsedPatch.data).filter(([, value]) => value !== undefined),
  ) as Partial<StoreOperationalSettings>;
  const next = {
    ...base,
    ...patchValues,
    activeCategories: patchValues.activeCategories ?? base.activeCategories,
  };
  return storeOperationalSettingsSchema.parse(next);
}

function valuesEqual(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function diffStoreOperationalSettingsPatch(
  before: unknown,
  after: unknown,
): StoreOperationalSettingsPatch {
  const previous = normalizeStoreOperationalSettings(before ?? {});
  const next = normalizeStoreOperationalSettings(after ?? {});
  const patch: StoreOperationalSettingsPatch = {};

  if (!valuesEqual(previous.activeCategories, next.activeCategories)) {
    patch.activeCategories = next.activeCategories;
  }
  if (previous.reviewEnabled !== next.reviewEnabled) {
    patch.reviewEnabled = next.reviewEnabled;
  }
  if (previous.closeoutReviewEnabled !== next.closeoutReviewEnabled) {
    patch.closeoutReviewEnabled = next.closeoutReviewEnabled;
  }
  if (previous.employeeHistoryVisibility !== next.employeeHistoryVisibility) {
    patch.employeeHistoryVisibility = next.employeeHistoryVisibility;
  }
  if (previous.closeoutAlert !== next.closeoutAlert) {
    patch.closeoutAlert = next.closeoutAlert;
  }
  if (previous.attachmentAlert !== next.attachmentAlert) {
    patch.attachmentAlert = next.attachmentAlert;
  }
  if (!valuesEqual(previous.notebookTheme, next.notebookTheme)) {
    patch.notebookTheme = next.notebookTheme;
  }

  return patch;
}
