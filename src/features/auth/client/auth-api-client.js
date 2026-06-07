import { fetchApiJson } from "@/core/client/api-fetch";

export async function requestOwnerOtpViaApi({ channel = "whatsapp", destination }) {
  return fetchApiJson("/api/v1/auth/otp/request", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: {
      channel,
      destination,
      purpose: "owner_login",
    },
    errorMessage: "OTP request failed.",
  });
}

export async function verifyOwnerOtpViaApi({ channel = "whatsapp", destination, code }) {
  return fetchApiJson("/api/v1/auth/otp/verify", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: {
      channel,
      destination,
      code,
      purpose: "owner_login",
    },
    errorMessage: "OTP verification failed.",
  });
}
