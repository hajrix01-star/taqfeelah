"use client";

import { useCallback, useState } from "react";
import { changeOwnerPasswordViaSessionBridge } from "@/features/auth/client/session-bridge";
import type { AuthLang } from "@/features/auth/client/auth-client-types";
import { APP_IN_PRODUCTION_MODE } from "@/components/taqfeelah-app/taqfeelah-app-boot";
import { MIN_PASSWORD_LENGTH } from "@/core/auth/password-policy";

export function useOwnerPasswordChangeForm({
  lang,
  onComplete,
}: {
  lang: AuthLang;
  onComplete: () => void;
}) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = useCallback(async () => {
    if (submitting) return;
    if (newPassword.trim().length < MIN_PASSWORD_LENGTH) {
      setError(lang === "ar"
        ? `كلمة المرور الجديدة يجب أن تكون ${MIN_PASSWORD_LENGTH} أحرف على الأقل.`
        : `New password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(lang === "ar"
        ? "تأكيد كلمة المرور غير متطابق."
        : "Password confirmation does not match.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await changeOwnerPasswordViaSessionBridge({
        currentPassword,
        newPassword,
        useServerAuth: APP_IN_PRODUCTION_MODE,
      });
      onComplete();
    } catch (failure) {
      setError(
        failure instanceof Error && failure.message
          ? failure.message
          : (lang === "ar" ? "تعذر تغيير كلمة المرور." : "Failed to change password."),
      );
    } finally {
      setSubmitting(false);
    }
  }, [
    confirmPassword,
    currentPassword,
    lang,
    newPassword,
    onComplete,
    submitting,
  ]);

  return {
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    error,
    submitting,
    submit,
  };
}
