/** Safe localStorage helpers (Safari private mode, quota, corrupt JSON). */

type SetResult =
  | { ok: true }
  | { ok: false; error: "no-window" | "quota" | "blocked" };

export function safeParseJson<T>(raw: string | null | undefined, fallback: T): T {
  if (raw == null || raw === "") return fallback;
  try {
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

export function safeSetLocalStorageItem(key: string, value: string): SetResult {
  if (typeof window === "undefined") return { ok: false, error: "no-window" };
  try {
    window.localStorage.setItem(key, value);
    return { ok: true };
  } catch (error) {
    const name = error && typeof error === "object" && "name" in error ? (error as Error).name : "";
    if (name === "QuotaExceededError") return { ok: false, error: "quota" };
    return { ok: false, error: "blocked" };
  }
}

export function readLocalStorageJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    return safeParseJson(window.localStorage.getItem(key), fallback);
  } catch {
    return fallback;
  }
}
