import { apiClient } from "@/core/client/api-client";

type SignupRequestResult = {
  message?: string;
};

type SignupVerifyResult = {
  setupUrl?: string;
};

export async function getPublicSignupStatusViaApi(): Promise<{ enabled: boolean }> {
  try {
    const payload = await apiClient.get<{ enabled?: boolean }>("/api/v1/auth/signup/status", {
      cache: "no-store",
    });
    return {
      enabled: payload?.enabled === true,
    };
  } catch {
    return { enabled: false };
  }
}

export async function requestPublicSignupViaApi(input: {
  organizationName: string;
  ownerName: string;
  ownerPhone: string;
  email: string;
  storeName?: string;
}): Promise<SignupRequestResult> {
  return apiClient.post("/api/v1/auth/signup/request", input, {
    errorMessage: "Unable to submit signup request.",
  });
}

export async function verifyPublicSignupViaApi(token: string): Promise<SignupVerifyResult> {
  return apiClient.post("/api/v1/auth/signup/verify", { token }, {
    errorMessage: "Unable to verify signup email.",
  });
}
