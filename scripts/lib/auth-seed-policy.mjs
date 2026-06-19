/**
 * Policy helpers for scripts/seed-auth-credentials.mjs
 * Keeps deploy-time seeding from overwriting production credentials.
 */

/** @typedef {Record<string, string | undefined>} EnvMap */

/** @param {EnvMap} env @param {string} name */
export function envFlagEnabled(env, name) {
  return env[name] === "true";
}

/** @param {EnvMap} env @param {string} name */
export function hasExplicitEnvValue(env, name) {
  const value = env[name];
  return typeof value === "string" && value.trim().length > 0;
}

/** Existing owner rows are preserved unless an operator explicitly forces a reset. */
/** @param {EnvMap} [env] */
export function shouldPreserveExistingOwnerIdentity(env = process.env) {
  return !envFlagEnabled(env, "AUTH_SEED_FORCE_OWNER_CREDENTIALS");
}

/** Force updates require explicit credentials — never silent defaults. */
/** @param {EnvMap} [env] */
export function canForceUpdateOwnerIdentity(env = process.env) {
  return (
    envFlagEnabled(env, "AUTH_SEED_FORCE_OWNER_CREDENTIALS") &&
    hasExplicitEnvValue(env, "AUTH_OWNER_USERNAME") &&
    hasExplicitEnvValue(env, "AUTH_OWNER_PASSWORD")
  );
}
