import {
  storeOperationalSettingsPatchSchema,
  storeOperationalSettingsSchema,
} from "@/domain/store-operational-settings/schema";
import type { StoreOperationalSettings } from "@/domain/store-operational-settings/types";

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
