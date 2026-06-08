import { isBrowserPersistentStorageAllowed } from "@/core/config/browser-persistence-policy";

/** Safe localStorage helpers (Safari private mode, quota, corrupt JSON). */

export function safeParseJson(raw, fallback) {
  if (raw == null || raw === "") return fallback;
  try {
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

export function safeSetLocalStorageItem(key, value, options = {}) {
  if (!isBrowserPersistentStorageAllowed(options)) return { ok: false, error: "disabled" };
  if (typeof window === "undefined") return { ok: false, error: "no-window" };
  try {
    window.localStorage.setItem(key, value);
    return { ok: true };
  } catch (error) {
    const name = error && typeof error === "object" && "name" in error ? error.name : "";
    if (name === "QuotaExceededError") return { ok: false, error: "quota" };
    return { ok: false, error: "blocked" };
  }
}

export function readLocalStorageJson(key, fallback, options = {}) {
  if (!isBrowserPersistentStorageAllowed(options)) return fallback;
  if (typeof window === "undefined") return fallback;
  try {
    return safeParseJson(window.localStorage.getItem(key), fallback);
  } catch {
    return fallback;
  }
}
