import { isEntriesApiEnabled } from "@/core/config/entries-api-mode";

type Phase9ApiEnv = {
  NEXT_PUBLIC_PHASE9_API_ENABLED?: string;
  NEXT_PUBLIC_ENTRIES_API_ENABLED?: string;
  NEXT_PUBLIC_CLOSEOUTS_API_ENABLED?: string;
};

/** Phase 9 server paths: duplicate-summary, notebook export, inline attachments. */
export function isPhase9ApiEnabled(
  env: Phase9ApiEnv = process.env as Phase9ApiEnv,
): boolean {
  if (env.NEXT_PUBLIC_PHASE9_API_ENABLED === "true") return true;
  if (env.NEXT_PUBLIC_PHASE9_API_ENABLED === "false") return false;
  return isEntriesApiEnabled(env);
}
