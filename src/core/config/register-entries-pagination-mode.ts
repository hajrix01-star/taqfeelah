import { isEntriesApiEnabled } from "@/core/config/entries-api-mode";

type RegisterEntriesPaginationEnv = {
  NEXT_PUBLIC_REGISTER_ENTRIES_PAGINATION_ENABLED?: string;
  NEXT_PUBLIC_ENTRIES_API_ENABLED?: string;
  NEXT_PUBLIC_CLOSEOUTS_API_ENABLED?: string;
};

function readRegisterEntriesPaginationEnv(): RegisterEntriesPaginationEnv {
  return {
    NEXT_PUBLIC_REGISTER_ENTRIES_PAGINATION_ENABLED: process.env.NEXT_PUBLIC_REGISTER_ENTRIES_PAGINATION_ENABLED,
    NEXT_PUBLIC_ENTRIES_API_ENABLED: process.env.NEXT_PUBLIC_ENTRIES_API_ENABLED,
    NEXT_PUBLIC_CLOSEOUTS_API_ENABLED: process.env.NEXT_PUBLIC_CLOSEOUTS_API_ENABLED,
  };
}

/** Register loads entries by cursor pages instead of relying on the bulk in-memory window. */
export function isRegisterEntriesPaginationEnabled(
  env: RegisterEntriesPaginationEnv = readRegisterEntriesPaginationEnv(),
): boolean {
  if (env.NEXT_PUBLIC_REGISTER_ENTRIES_PAGINATION_ENABLED === "true") return true;
  if (env.NEXT_PUBLIC_REGISTER_ENTRIES_PAGINATION_ENABLED === "false") return false;
  return isEntriesApiEnabled(env);
}
