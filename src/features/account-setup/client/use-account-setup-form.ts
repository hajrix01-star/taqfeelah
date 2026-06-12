"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  confirmAccountSetupViaApi,
  validateAccountSetupViaApi,
  type AccountSetupPreview,
} from "@/features/account-setup/client/account-setup-api-client";

export function useAccountSetupForm(token: string) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<AccountSetupPreview | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!token.trim()) {
      setLoading(false);
      return;
    }

    validateAccountSetupViaApi(token)
      .then((result) => {
        if (!cancelled) setPreview(result);
      })
      .catch(() => {
        if (!cancelled) setPreview(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  const submit = useCallback(
    async (event?: FormEvent<HTMLFormElement>) => {
      event?.preventDefault();
      if (!preview || submitting || !token.trim()) return;
      setError("");
      setSubmitting(true);
      try {
        await confirmAccountSetupViaApi({
          token: token.trim(),
          password: password.trim(),
          confirmPassword: confirmPassword.trim(),
        });
        router.replace("/app");
      } catch (failure) {
        setError(failure instanceof Error ? failure.message : "تعذر إكمال إعداد الحساب.");
      } finally {
        setSubmitting(false);
      }
    },
    [confirmPassword, password, preview, router, submitting, token],
  );

  return {
    loading,
    preview,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    error,
    submitting,
    submit,
    isValid: Boolean(preview),
  };
}
