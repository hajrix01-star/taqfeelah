import { isProductionAppMode } from "@/core/config/app-mode";
import { isPrototypeAccessMode } from "@/core/config/prototype-access-mode";

type CloseoutsApiEnv = {
  NEXT_PUBLIC_CLOSEOUTS_API_ENABLED?: string;
};

function readCloseoutsApiEnv(): CloseoutsApiEnv {
  return {
    NEXT_PUBLIC_CLOSEOUTS_API_ENABLED: process.env.NEXT_PUBLIC_CLOSEOUTS_API_ENABLED,
  };
}

export function isCloseoutsApiEnabled(
  env: CloseoutsApiEnv = readCloseoutsApiEnv(),
): boolean {
  return env.NEXT_PUBLIC_CLOSEOUTS_API_ENABLED === "true";
}

/** DB is the closeouts source when the closeouts API flag is on. */
export function isCloseoutsApiDbSourceMode(
  env: CloseoutsApiEnv = readCloseoutsApiEnv(),
): boolean {
  return isCloseoutsApiEnabled(env);
}

/** Fail hard on API errors only when real server-auth production mode is active. */
export function isCloseoutsApiStrictMode(): boolean {
  return isProductionAppMode() && !isPrototypeAccessMode();
}
