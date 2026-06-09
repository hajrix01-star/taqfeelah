import { isProductionAppMode } from "@/core/config/app-mode";
import { isPrototypeAccessMode } from "@/core/config/prototype-access-mode";

type EntriesApiEnv = {
  NEXT_PUBLIC_ENTRIES_API_ENABLED?: string;
  NEXT_PUBLIC_CLOSEOUTS_API_ENABLED?: string;
};

function readEntriesApiEnv(): EntriesApiEnv {
  return {
    NEXT_PUBLIC_ENTRIES_API_ENABLED: process.env.NEXT_PUBLIC_ENTRIES_API_ENABLED,
    NEXT_PUBLIC_CLOSEOUTS_API_ENABLED: process.env.NEXT_PUBLIC_CLOSEOUTS_API_ENABLED,
  };
}

export function isEntriesApiEnabled(
  env: EntriesApiEnv = readEntriesApiEnv(),
): boolean {
  if (env.NEXT_PUBLIC_ENTRIES_API_ENABLED === "true") return true;
  if (env.NEXT_PUBLIC_ENTRIES_API_ENABLED === "false") return false;
  return env.NEXT_PUBLIC_CLOSEOUTS_API_ENABLED === "true";
}

/** DB is the operational-entries source when the entries API flag is on. */
export function isEntriesApiDbSourceMode(
  env: EntriesApiEnv = readEntriesApiEnv(),
): boolean {
  return isEntriesApiEnabled(env);
}

/** Fail hard on API errors only when real server-auth production mode is active. */
export function isEntriesApiStrictMode(): boolean {
  return isProductionAppMode() && !isPrototypeAccessMode();
}
