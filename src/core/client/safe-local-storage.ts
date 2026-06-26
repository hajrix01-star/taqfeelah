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

export function readLocalStorageJson<T>(
  key: string,
  fallback: T,
  options: LocalStoragePolicyOptions = {},
): T {
  if (!isBrowserPersistentStorageAllowed(options)) return fallback;
  if (typeof window === "undefined") return fallback;
  try {
    return safeParseJson(window.localStorage.getItem(key), fallback);
  } catch {
    return fallback;
  }
}
