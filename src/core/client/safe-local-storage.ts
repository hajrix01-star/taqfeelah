import { isBrowserPersistentStorageAllowed } from "@/core/config/browser-persistence-policy";
import type { BrowserPersistenceScope } from "@/core/config/browser-persistence-policy";

export type LocalStoragePolicyOptions = {
  scope?: BrowserPersistenceScope;
  env?: Record<string, string | undefined>;
};

export type LocalStorageWriteResult = {
  ok: boolean;
  error?: string;
};

/** Safe localStorage helpers (Safari private mode, quota, corrupt JSON). */

export function safeParseJson<T>(raw: string | null, fallback: T): T {
  if (raw == null || raw === "") return fallback;
  try {
    const parsed = JSON.parse(raw) as T | null;
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

export function safeSetLocalStorageItem(
  key: string,
  value: string,
  options: LocalStoragePolicyOptions = {},
): LocalStorageWriteResult {
  if (!isBrowserPersistentStorageAllowed(options)) return { ok: false, error: "disabled" };
  if (typeof window === "undefined") return { ok: false, error: "no-window" };
  try {
    window.localStorage.setItem(key, value);
    return { ok: true };
  } catch (error) {
    const name = error && typeof error === "object" && "name" in error ? String(error.name) : "";
    if (name === "QuotaExceededError") return { ok: false, error: "quota" };
    return { ok: false, error: "blocked" };
  }
}

export function safeGetLocalStorageItem(
  key: string,
  options: LocalStoragePolicyOptions = {},
): string | null {
  if (!isBrowserPersistentStorageAllowed(options)) return null;
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function safeRemoveLocalStorageItem(
  key: string,
  options: LocalStoragePolicyOptions = {},
): LocalStorageWriteResult {
  if (!isBrowserPersistentStorageAllowed(options)) return { ok: false, error: "disabled" };
  if (typeof window === "undefined") return { ok: false, error: "no-window" };
  try {
    window.localStorage.removeItem(key);
    return { ok: true };
  } catch {
    return { ok: false, error: "blocked" };
  }
}

export function safeListLocalStorageKeys(
  options: LocalStoragePolicyOptions = {},
): string[] {
  if (!isBrowserPersistentStorageAllowed(options)) return [];
  if (typeof window === "undefined") return [];
  try {
    const keys: string[] = [];
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);
      if (key) keys.push(key);
    }
    return keys;
  } catch {
    return [];
  }
}

export function safeGetSessionStorageItem(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

export function safeSetSessionStorageItem(key: string, value: string): LocalStorageWriteResult {
  if (typeof window === "undefined") return { ok: false, error: "no-window" };
  try {
    window.sessionStorage.setItem(key, value);
    return { ok: true };
  } catch {
    return { ok: false, error: "blocked" };
  }
}

export function safeRemoveSessionStorageItem(key: string): LocalStorageWriteResult {
  if (typeof window === "undefined") return { ok: false, error: "no-window" };
  try {
    window.sessionStorage.removeItem(key);
    return { ok: true };
  } catch {
    return { ok: false, error: "blocked" };
  }
}

export function readLocalStorageJson<T>(
  key: string,
  fallback: T,
  options: LocalStoragePolicyOptions = {},
): T {
  return safeParseJson(safeGetLocalStorageItem(key, options), fallback);
}
