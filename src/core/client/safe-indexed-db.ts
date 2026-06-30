import { isBrowserPersistentStorageAllowed } from "@/core/config/browser-persistence-policy";
import type { BrowserPersistenceScope } from "@/core/config/browser-persistence-policy";

export type IndexedDbPolicyOptions = {
  scope?: BrowserPersistenceScope;
  env?: Record<string, string | undefined>;
};

export type IndexedDbStoreConfig = {
  databaseName: string;
  storeName: string;
  version?: number;
};

function canUseIndexedDb(options: IndexedDbPolicyOptions = {}): boolean {
  return isBrowserPersistentStorageAllowed(options) && typeof indexedDB !== "undefined";
}

async function withObjectStore<T>(
  config: IndexedDbStoreConfig,
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T> | void,
  options: IndexedDbPolicyOptions = {},
): Promise<T | null> {
  if (!canUseIndexedDb(options)) return null;

  const database = await new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(config.databaseName, config.version ?? 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(config.storeName)) {
        request.result.createObjectStore(config.storeName);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  try {
    return await new Promise<T | null>((resolve, reject) => {
      const transaction = database.transaction(config.storeName, mode);
      const request = operation(transaction.objectStore(config.storeName));
      let requestResult: T | null = null;

      if (request) {
        request.onsuccess = () => {
          requestResult = (request.result as T | undefined) ?? null;
        };
        request.onerror = () => reject(request.error);
      }

      transaction.oncomplete = () => resolve(requestResult);
      transaction.onerror = () => reject(transaction.error);
    });
  } finally {
    database.close();
  }
}

export async function safePutIndexedDbValue(
  config: IndexedDbStoreConfig,
  key: IDBValidKey,
  value: unknown,
  options: IndexedDbPolicyOptions = {},
): Promise<boolean> {
  if (!canUseIndexedDb(options)) return false;
  try {
    await withObjectStore(config, "readwrite", (store) => store.put(value, key), options);
    return true;
  } catch {
    return false;
  }
}

export async function safeDeleteIndexedDbValue(
  config: IndexedDbStoreConfig,
  key: IDBValidKey,
  options: IndexedDbPolicyOptions = {},
): Promise<boolean> {
  if (!canUseIndexedDb(options)) return false;
  try {
    await withObjectStore(config, "readwrite", (store) => store.delete(key), options);
    return true;
  } catch {
    return false;
  }
}

export async function safeGetIndexedDbValue<T>(
  config: IndexedDbStoreConfig,
  key: IDBValidKey,
  options: IndexedDbPolicyOptions = {},
): Promise<T | null> {
  try {
    return await withObjectStore<T>(config, "readonly", (store) => store.get(key), options);
  } catch {
    return null;
  }
}
