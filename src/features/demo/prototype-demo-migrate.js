import { DAILY_CLOSEOUTS_STORAGE_KEY, CLOSEOUT_EVENTS_STORAGE_KEY } from "../daily-closeouts/daily-closeouts-demo-store";
import {
  createPrototypeMonthDemoDataset,
  PROTOTYPE_DEMO_DATASET_VERSION,
  PROTOTYPE_DEMO_DATASET_VERSION_KEY,
  PROTOTYPE_DEMO_LAST_CLOSEOUT_KEY,
  PROTOTYPE_DEMO_OPERATIONAL_ENTRIES_KEY,
} from "./prototype-month-demo-seed";
import { safeSetLocalStorageItem } from "./prototype-storage";

let migrateInFlight = false;

export function migratePrototypeDemoDatasetIfNeeded() {
  if (typeof window === "undefined") return { migrated: false };
  const current = window.localStorage.getItem(PROTOTYPE_DEMO_DATASET_VERSION_KEY);
  if (current === PROTOTYPE_DEMO_DATASET_VERSION) return { migrated: false };
  if (migrateInFlight) return { migrated: false };
  migrateInFlight = true;

  try {
    const dataset = createPrototypeMonthDemoDataset();
    const writes = [
      safeSetLocalStorageItem(PROTOTYPE_DEMO_OPERATIONAL_ENTRIES_KEY, JSON.stringify(dataset.operationalEntries)),
      safeSetLocalStorageItem(DAILY_CLOSEOUTS_STORAGE_KEY, JSON.stringify(dataset.closeouts)),
      safeSetLocalStorageItem(CLOSEOUT_EVENTS_STORAGE_KEY, JSON.stringify(dataset.closeoutEvents)),
      safeSetLocalStorageItem(PROTOTYPE_DEMO_LAST_CLOSEOUT_KEY, JSON.stringify(dataset.lastCloseoutDates)),
      safeSetLocalStorageItem(PROTOTYPE_DEMO_DATASET_VERSION_KEY, PROTOTYPE_DEMO_DATASET_VERSION),
    ];
    const failed = writes.find((item) => !item.ok);
    if (failed) return { migrated: false, error: failed.error || "storage" };
    return { migrated: true };
  } finally {
    migrateInFlight = false;
  }
}
