export async function getPublicSignupStatusViaApi(): Promise<{ enabled: boolean }> {
  const response = await fetch("/api/v1/auth/signup/status", {
    method: "GET",
    cache: "no-store",
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    return { enabled: false };
  }
  return {
    enabled: payload?.enabled === true,
  };
}

export async function requestPublicSignupViaApi(input: {
  organizationName: string;
  ownerName: string;
  ownerPhone: string;
  email: string;
  storeName?: string;
}) {
  const response = await fetch("/api/v1/auth/signup/request", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error?.message || "تعذر إرسال طلب التسجيل.");
  }
  return payload ?? {};
}

export async function verifyPublicSignupViaApi(token: string) {
  const response = await fetch("/api/v1/auth/signup/verify", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ token }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error?.message || "تعذر تأكيد البريد الإلكتروني.");
  }
  return payload ?? {};
}
