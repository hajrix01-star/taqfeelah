import { apiClient } from "@/core/client/api-client";

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
  const payload = await apiClient.get<AccountSetupPreview | { data?: AccountSetupPreview }>(
    `/api/v1/auth/setup/validate?${search.toString()}`,
    { errorMessage: "Failed to validate setup link." },
  );
  if (payload && typeof payload === "object" && "data" in payload && payload.data) {
    return payload.data;
  }
  return payload as AccountSetupPreview;
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
  return apiClient.post("/api/v1/auth/setup/confirm", { token, password, confirmPassword }, {
    errorMessage: "Failed to complete account setup.",
  });
}
