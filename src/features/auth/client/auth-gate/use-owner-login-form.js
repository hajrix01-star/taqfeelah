"use client";

import { useCallback, useEffect, useState } from "react";
import { getEnabledOwnerLoginMethods, isOwnerLoginMethodEnabled } from "@/core/auth/owner-login-methods";
import {
  clearOwnerCredentials,
  readOwnerCredentials,
  saveOwnerCredentials,
} from "@/features/demo/login-credentials-storage";
import { loginOwnerViaSessionBridge } from "@/features/auth/client/session-bridge";
import { text } from "@/components/prototype-runtime/prototype-runtime-demo-data";
import {
  APP_IN_PRODUCTION_MODE,
  PROTOTYPE_DEMO_OTP,
  PROTOTYPE_OWNER_PASSWORD,
  PROTOTYPE_OWNER_USERNAME,
} from "@/components/prototype-runtime/prototype-runtime-boot";

export function useOwnerLoginForm({ lang, onOwnerLogin }) {
  const ownerLoginMethods = getEnabledOwnerLoginMethods();
  const [method, setMethod] = useState(
    ownerLoginMethods.includes("whatsapp_otp") ? "phone" : "password",
  );
  const [stage, setStage] = useState("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [username, setUsername] = useState(PROTOTYPE_OWNER_USERNAME);
  const [ownerPhone, setOwnerPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    const saved = readOwnerCredentials();
    if (!saved) return;
    setRememberMe(true);
    if (saved.username) setUsername(saved.username);
    if (saved.phone) setOwnerPhone(saved.phone);
    if (saved.password) setPassword(saved.password);
  }, []);

  useEffect(() => {
    if (method === "phone" && !isOwnerLoginMethodEnabled("whatsapp_otp")) {
      setMethod("password");
    }
  }, [method]);

  const submitOtp = useCallback(() => {
    if (`${code}`.trim() !== PROTOTYPE_DEMO_OTP) {
      setError(text(lang, "invalidOtp"));
      return;
    }
    setError("");
    onOwnerLogin();
  }, [code, lang, onOwnerLogin]);

  const submitPassword = useCallback(async () => {
    if (submitting) return;
    if (APP_IN_PRODUCTION_MODE) {
      setSubmitting(true);
      try {
        const session = await loginOwnerViaSessionBridge({
          phone: ownerPhone.trim(),
          username: username.trim(),
          password,
          useServerAuth: true,
        });
        onOwnerLogin(
          typeof session?.userId === "string" ? session.userId : "",
          typeof session?.organizationId === "string" ? session.organizationId : "",
          typeof session?.displayName === "string" ? session.displayName : "",
          session?.mustChangePassword === true,
        );
      } catch (failure) {
        const message = failure instanceof Error && failure.message
          ? failure.message
          : text(lang, "invalidCredentials");
        setError(message);
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (
      username.trim().toLowerCase() !== PROTOTYPE_OWNER_USERNAME
      || password !== PROTOTYPE_OWNER_PASSWORD
    ) {
      setError(text(lang, "invalidCredentials"));
      return;
    }

    setError("");
    if (rememberMe) saveOwnerCredentials({ username: username.trim(), password });
    else clearOwnerCredentials();
    onOwnerLogin();
  }, [
    lang,
    onOwnerLogin,
    ownerPhone,
    password,
    rememberMe,
    submitting,
    username,
  ]);

  const canUsePhoneOtp = isOwnerLoginMethodEnabled("whatsapp_otp");
  const canUsePassword = isOwnerLoginMethodEnabled("username_password");
  const showAuthMethodTabs = canUsePhoneOtp && canUsePassword;

  return {
    method,
    setMethod,
    stage,
    setStage,
    phone,
    setPhone,
    code,
    setCode,
    username,
    setUsername,
    ownerPhone,
    setOwnerPhone,
    password,
    setPassword,
    error,
    setError,
    submitting,
    rememberMe,
    setRememberMe,
    submitOtp,
    submitPassword,
    canUsePhoneOtp,
    canUsePassword,
    showAuthMethodTabs,
  };
}
