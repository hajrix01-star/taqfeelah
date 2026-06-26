/**
 * Policy helpers for scripts/seed-auth-credentials.mjs
 * Keeps deploy-time seeding from overwriting production credentials.
 */

/** @typedef {Record<string, string | undefined>} EnvMap */

export const OWNER_CREDENTIAL_RESET_CONFIRMATION = "rotate-owner-auth";

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

/** @param {EnvMap} [env] */
export function isProductionScriptEnv(env = process.env) {
  return env.APP_MODE === "production" || env.NODE_ENV === "production";
}

/** @param {EnvMap} [env] */
export function ownerCredentialResetConfirmed(env = process.env) {
  return env.AUTH_OWNER_RESET_CONFIRM === OWNER_CREDENTIAL_RESET_CONFIRMATION;
}

/** @param {EnvMap} [env] */
export function assertOwnerCredentialResetEnv(env = process.env) {
  if (!ownerCredentialResetConfirmed(env)) {
    throw new Error(
      `AUTH_OWNER_RESET_CONFIRM=${OWNER_CREDENTIAL_RESET_CONFIRMATION} is required to rotate owner credentials.`,
    );
  }
  if (!hasExplicitEnvValue(env, "AUTH_OWNER_USER_ID") && !hasExplicitEnvValue(env, "SEED_OWNER_USER_ID")) {
    throw new Error("AUTH_OWNER_USER_ID or SEED_OWNER_USER_ID is required.");
  }
  if (!hasExplicitEnvValue(env, "AUTH_OWNER_USERNAME")) {
    throw new Error("AUTH_OWNER_USERNAME is required.");
  }
  if (!hasExplicitEnvValue(env, "AUTH_OWNER_PASSWORD")) {
    throw new Error("AUTH_OWNER_PASSWORD is required.");
  }
}

/** @param {EnvMap} [env] */
export function assertSafeAuthSeedEnv(env = process.env) {
  if (!isProductionScriptEnv(env)) return;
  if (!hasExplicitEnvValue(env, "AUTH_OWNER_USER_ID") && !hasExplicitEnvValue(env, "SEED_OWNER_USER_ID")) {
    throw new Error("Production auth seed requires AUTH_OWNER_USER_ID or SEED_OWNER_USER_ID.");
  }
  if (!hasExplicitEnvValue(env, "AUTH_OWNER_USERNAME")) {
    throw new Error("Production auth seed requires AUTH_OWNER_USERNAME.");
  }
  if (!hasExplicitEnvValue(env, "AUTH_OWNER_PASSWORD")) {
    throw new Error("Production auth seed requires AUTH_OWNER_PASSWORD.");
  }
  if (!hasExplicitEnvValue(env, "SEED_EMPLOYEE_PIN_MAP")) {
    throw new Error("Production auth seed requires SEED_EMPLOYEE_PIN_MAP; default employee PINs are not allowed.");
  }
}
