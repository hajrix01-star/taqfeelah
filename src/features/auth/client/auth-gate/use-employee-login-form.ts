"use client";

import { useCallback, useEffect, useState } from "react";
import {
  employeePinMatches,
  filterActiveLoginStaff,
  normalizeEmployeeLoginRosterStaff,
  resolveEmployeeLoginStaff,
} from "@/features/employee-closeouts/employee-portal-session";
import { readEmployeeLoginRosterPayload } from "@/features/auth/client/auth-api-response";
import { loginEmployeeViaSessionBridge } from "@/features/auth/client/session-bridge";
import type {
  AuthLang,
  AuthStaffMember,
  EmployeeLoginCallback,
} from "@/features/auth/client/auth-client-types";
import { fetchEmployeeLoginRosterViaApi } from "@/features/runtime-settings/client/runtime-session-and-settings-api-client";
import { text } from "@/components/taqfeelah-app/taqfeelah-app-catalog-data";
import {
  APP_IN_PRODUCTION_MODE,
  LOCAL_DEV_EMPLOYEE_PIN_DEFAULT,
} from "@/components/taqfeelah-app/taqfeelah-app-boot";

export function useEmployeeLoginForm({
  lang,
  staff = [],
  onLogin,
}: {
  lang: AuthLang;
  staff?: AuthStaffMember[];
  onLogin: EmployeeLoginCallback;
}) {
  const [selectedId, setSelectedId] = useState("");
  const [manualEmployeeId, setManualEmployeeId] = useState("");
  const [employeePhone, setEmployeePhone] = useState("");
  const [pin, setPin] = useState("");
  const [trustDevice, setTrustDevice] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [rosterStaff, setRosterStaff] = useState<AuthStaffMember[]>([]);
  const [rosterLoading, setRosterLoading] = useState(APP_IN_PRODUCTION_MODE);

  const loginStaff = resolveEmployeeLoginStaff(staff, rosterStaff, APP_IN_PRODUCTION_MODE);
  const activeStaff = filterActiveLoginStaff(loginStaff);

  useEffect(() => {
    // Production employee login uses phone + PIN only; roster is not shown publicly.
    if (APP_IN_PRODUCTION_MODE) return;
    let cancelled = false;
    fetchEmployeeLoginRosterViaApi()
      .then((payload) => {
        if (cancelled) return;
        const rosterPayload = readEmployeeLoginRosterPayload(payload);
        if (Array.isArray(rosterPayload.staff)) {
          setRosterStaff(normalizeEmployeeLoginRosterStaff(rosterPayload));
        }
      })
      .catch((failure) => {
        if (cancelled) return;
        console.warn("employee roster load failed", failure);
      })
      .finally(() => {
        if (!cancelled) setRosterLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedId && activeStaff[0]) setSelectedId(activeStaff[0].id || "");
  }, [activeStaff, selectedId]);

  const submit = useCallback(async () => {
    if (submitting) return;

    if (APP_IN_PRODUCTION_MODE) {
      const phone = employeePhone.trim();
      if (!phone) {
        setError(lang === "ar" ? "أدخل جوالك." : "Enter your mobile number.");
        return;
      }
      setSubmitting(true);
      try {
        const session = await loginEmployeeViaSessionBridge({
          phone,
          pin: pin.trim() || undefined,
          trustDevice,
          useServerAuth: true,
        });
        const sessionUserId = typeof session?.userId === "string" ? session.userId : "";
        const sessionDisplayName = typeof session?.displayName === "string" ? session.displayName.trim() : "";
        const person = activeStaff.find((item) => (
          item.id === sessionUserId
          || item.legacyId === sessionUserId
          || item.apiUserId === sessionUserId
        ));
        const rosterPerson = person || (sessionDisplayName ? {
          id: sessionUserId,
          apiUserId: sessionUserId,
          nameAr: sessionDisplayName,
          nameEn: sessionDisplayName,
          active: true,
          removed: false,
          storeIds: [],
        } : null);
        onLogin(
          person?.id || sessionUserId,
          sessionUserId,
          rosterPerson,
          typeof session?.organizationId === "string" ? session.organizationId : "",
        );
      } catch (failure) {
        const message = failure instanceof Error && failure.message
          ? failure.message
          : text(lang, "invalidEmployeePin");
        setError(message);
      } finally {
        setSubmitting(false);
      }
      return;
    }

    const employeeIdentifier = activeStaff.length > 0 ? selectedId : manualEmployeeId.trim();

    const person = activeStaff.find((item) => (
      item.id === employeeIdentifier
      || item.legacyId === employeeIdentifier
      || item.apiUserId === employeeIdentifier
    ));

    if (!employeeIdentifier) {
      setError(text(lang, "noActiveEmployee"));
      return;
    }

    if (!person || !employeePinMatches(person, pin, LOCAL_DEV_EMPLOYEE_PIN_DEFAULT)) {
      setError(text(lang, "invalidEmployeePin"));
      return;
    }

    setError("");
    onLogin(person?.id || employeeIdentifier, "", person || null);
  }, [
    activeStaff,
    employeePhone,
    lang,
    manualEmployeeId,
    onLogin,
    pin,
    selectedId,
    submitting,
    trustDevice,
  ]);

  return {
    activeStaff,
    rosterLoading,
    selectedId,
    setSelectedId,
    manualEmployeeId,
    setManualEmployeeId,
    employeePhone,
    setEmployeePhone,
    pin,
    setPin,
    trustDevice,
    setTrustDevice,
    error,
    submitting,
    submit,
  };
}
