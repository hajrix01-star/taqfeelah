export type AccountSetupPreview = {
  purpose: "onboarding" | "password_reset";
  phoneNumber: string;
  ownerName: string;
  ownerEmail: string | null;
  organizationName: string;
  expiresAt: string;
};

export async function validateAccountSetupViaApi(token: string): Promise<AccountSetupPreview> {
  const search = new URLSearchParams({ token });
  const response = await fetch(`/api/v1/auth/setup/validate?${search.toString()}`, {
    credentials: "include",
  });
  const payload = await response.json().catch(() => ({})) as { data?: AccountSetupPreview; error?: { message?: string } };
  if (!response.ok) {
    throw new Error(payload?.error?.message || "Failed to validate setup link.");
  }
  return (payload.data ?? payload) as AccountSetupPreview;
}

export async function confirmAccountSetupViaApi({
  token,
  password,
  confirmPassword,
}: {
  token: string;
  password: string;
  confirmPassword: string;
}) {
  const response = await fetch("/api/v1/auth/setup/confirm", {
    method: "POST",
    credentials: "include",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ token, password, confirmPassword }),
  });
  const payload = await response.json().catch(() => ({})) as { error?: { message?: string } };
  if (!response.ok) {
    throw new Error(payload?.error?.message || "Failed to complete account setup.");
  }
  return payload;
}
