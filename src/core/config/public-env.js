/**
 * Next.js inlines NEXT_PUBLIC_* only for direct `process.env.KEY` reads.
 * Dynamic `env.KEY` lookups on the process.env object stay empty in client bundles.
 */

/**
 * @param {Record<string, string | undefined> | undefined} env
 * @returns {env is Record<string, string | undefined>}
 */
export function usesCustomEnv(env) {
  return env !== undefined && env !== process.env;
}

/**
 * @param {string} key
 * @param {Record<string, string | undefined> | undefined} [env]
 * @returns {string}
 */
export function readPublicEnvString(key, env) {
  if (usesCustomEnv(env)) return env[key] || "";
  switch (key) {
    case "NEXT_PUBLIC_CLOSEOUTS_API_ENABLED":
      return process.env.NEXT_PUBLIC_CLOSEOUTS_API_ENABLED || "";
    case "NEXT_PUBLIC_ENTRIES_API_ENABLED":
      return process.env.NEXT_PUBLIC_ENTRIES_API_ENABLED || "";
    case "NEXT_PUBLIC_REGISTER_ENTRIES_PAGINATION_ENABLED":
      return process.env.NEXT_PUBLIC_REGISTER_ENTRIES_PAGINATION_ENABLED || "";
    case "NEXT_PUBLIC_ORG_CONFIG_API_ENABLED":
      return process.env.NEXT_PUBLIC_ORG_CONFIG_API_ENABLED || "";
    case "NEXT_PUBLIC_PHASE9_API_ENABLED":
      return process.env.NEXT_PUBLIC_PHASE9_API_ENABLED || "";
    case "NEXT_PUBLIC_CLOSEOUTS_API_ORGANIZATION_ID":
      return process.env.NEXT_PUBLIC_CLOSEOUTS_API_ORGANIZATION_ID || "";
    case "NEXT_PUBLIC_CLOSEOUTS_API_OWNER_USER_ID":
      return process.env.NEXT_PUBLIC_CLOSEOUTS_API_OWNER_USER_ID || "";
    case "NEXT_PUBLIC_SUPPORT_WHATSAPP":
      return process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP || "";
    default:
      return "";
  }
}
