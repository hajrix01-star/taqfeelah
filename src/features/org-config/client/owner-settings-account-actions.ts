export function validateOwnerAuthCredentials(ownerUsername: string, ownerPassword: string) {
  const username = ownerUsername.trim();
  const password = ownerPassword.trim();
  return {
    valid: Boolean(username && password),
    username,
    password,
  };
}

export function buildOwnerProfileUpdate(ownerProfile: Record<string, unknown>, name: string) {
  const trimmedName = name.trim();
  if (!trimmedName) return null;
  return { ...ownerProfile, name: trimmedName };
}

export function isOwnerProfileDirty(draftName: string, currentName?: string) {
  const trimmed = draftName.trim();
  return Boolean(trimmed && trimmed !== currentName);
}

export function isOwnerAuthDirty({
  draftUsername,
  draftPassword,
  currentUsername = "",
  currentPassword = "",
}: {
  draftUsername: string;
  draftPassword: string;
  currentUsername?: string;
  currentPassword?: string;
}) {
  return draftUsername.trim() !== currentUsername
    || draftPassword.trim() !== currentPassword;
}
