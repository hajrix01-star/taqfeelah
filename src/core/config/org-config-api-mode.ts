import { isEntriesApiEnabled } from "@/core/config/entries-api-mode";

type OrgConfigApiEnv = {
  NEXT_PUBLIC_ORG_CONFIG_API_ENABLED?: string;
  NEXT_PUBLIC_ENTRIES_API_ENABLED?: string;
  NEXT_PUBLIC_CLOSEOUTS_API_ENABLED?: string;
};

/** Org config reads/writes through dedicated store/member/channel APIs instead of settings blob only. */
export function isOrgConfigApiEnabled(
  env: OrgConfigApiEnv = process.env as OrgConfigApiEnv,
): boolean {
  if (env.NEXT_PUBLIC_ORG_CONFIG_API_ENABLED === "true") return true;
  if (env.NEXT_PUBLIC_ORG_CONFIG_API_ENABLED === "false") return false;
  return isEntriesApiEnabled(env);
}
