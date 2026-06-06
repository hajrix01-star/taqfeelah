async function parseErrorMessage(response, fallback) {
  try {
    const payload = await response.json();
    if (payload?.error?.message) return payload.error.message;
    return fallback;
  } catch {
    return fallback;
  }
}

export async function requestOwnerOtpViaApi({ channel = "whatsapp", destination }) {
  const response = await fetch("/api/v1/auth/otp/request", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ channel, destination, purpose: "owner_login" }),
  });
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, "OTP request failed."));
  }
  return response.json();
}

export async function verifyOwnerOtpViaApi({ channel = "whatsapp", destination, code }) {
  const response = await fetch("/api/v1/auth/otp/verify", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ channel, destination, code, purpose: "owner_login" }),
  });
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, "OTP verification failed."));
  }
  return response.json();
}
