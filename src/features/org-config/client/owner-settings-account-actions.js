/**
 * @param {string} ownerUsername
 * @param {string} ownerPassword
 */
export function validateOwnerAuthCredentials(ownerUsername, ownerPassword) {
  const username = ownerUsername.trim();
  const password = ownerPassword.trim();
  return {
    valid: Boolean(username && password),
    username,
    password,
  };
}

/**
 * @param {Record<string, unknown>} ownerProfile
 * @param {string} name
 */
export function buildOwnerProfileUpdate(ownerProfile, name) {
  const trimmedName = name.trim();
  if (!trimmedName) return null;
  return { ...ownerProfile, name: trimmedName };
}

/**
 * @param {string} draftName
 * @param {string} [currentName]
 */
export function isOwnerProfileDirty(draftName, currentName) {
  const trimmed = draftName.trim();
  return Boolean(trimmed && trimmed !== currentName);
}

/**
 * @param {Object} input
 * @param {string} input.draftUsername
 * @param {string} input.draftPassword
 * @param {string} [input.currentUsername]
 * @param {string} [input.currentPassword]
 */
export function isOwnerAuthDirty({
  draftUsername,
  draftPassword,
  currentUsername = "",
  currentPassword = "",
}) {
  return draftUsername.trim() !== currentUsername
    || draftPassword.trim() !== currentPassword;
}
