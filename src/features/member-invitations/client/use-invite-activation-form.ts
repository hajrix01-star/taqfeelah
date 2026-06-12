"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { InvitationPreview } from "@/features/member-invitations/client/invite-activation-types";
import {
  activateMemberInvitationViaApi,
  fetchPublicInvitationViaApi,
} from "@/features/member-invitations/client/member-invitations-api-client";

export function useInviteActivationForm(token: string) {
  const router = useRouter();
  const [preview, setPreview] = useState<InvitationPreview | null>(null);
  const [loadError, setLoadError] = useState("");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [trustDevice, setTrustDevice] = useState(true);
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchPublicInvitationViaApi(token)
      .then((data) => {
        if (cancelled) return;
        setPreview(data as InvitationPreview);
      })
      .catch((error) => {
        if (cancelled) return;
        setLoadError(error instanceof Error ? error.message : "تعذر تحميل الدعوة.");
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const submit = useCallback(
    async (event?: FormEvent<HTMLFormElement>) => {
      event?.preventDefault();
      if (!preview?.canActivate || submitting) return;
      setSubmitError("");
      setSubmitting(true);
      try {
        await activateMemberInvitationViaApi({
          token,
          phone: phone.trim(),
          pin: pin.trim(),
          trustDevice,
        });
        router.replace("/app");
      } catch (error) {
        setSubmitError(error instanceof Error ? error.message : "تعذر تفعيل الدعوة.");
      } finally {
        setSubmitting(false);
      }
    },
    [phone, pin, preview, router, submitting, token, trustDevice],
  );

  return {
    preview,
    loadError,
    phone,
    setPhone,
    pin,
    setPin,
    trustDevice,
    setTrustDevice,
    submitError,
    submitting,
    submit,
  };
}
