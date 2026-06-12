"use client";

import { useCallback, useEffect, useState } from "react";
import { isUuid } from "@/core/client/api-id-utils";
import {
  clearEmployeeCredentials,
  readEmployeeCredentials,
  saveEmployeeCredentials,
} from "@/features/demo/login-credentials-storage";
import {
  employeePinMatches,
  filterActiveLoginStaff,
  normalizeEmployeeLoginRosterStaff,
  resolveEmployeeLoginStaff,
} from "@/features/employee-closeouts/employee-portal-session";
import { loginEmployeeViaSessionBridge } from "@/features/auth/client/session-bridge";
import { fetchEmployeeLoginRosterViaApi } from "@/features/runtime-settings/client/runtime-session-and-settings-api-client";
import { text } from "@/components/prototype-runtime/prototype-runtime-demo-data";
import {
  APP_IN_PRODUCTION_MODE,
  PROTOTYPE_EMPLOYEE_PIN_DEFAULT,
} from "@/components/prototype-runtime/prototype-runtime-boot";

export function useEmployeeLoginForm({ lang, staff = [], onLogin }) {
  const [selectedId, setSelectedId] = useState("");
  const [manualEmployeeId, setManualEmployeeId] = useState("");
  const [employeePhone, setEmployeePhone] = useState("");
  const [boundUserId, setBoundUserId] = useState("");
  const [pin, setPin] = useState("");
  const [trustDevice, setTrustDevice] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [rosterStaff, setRosterStaff] = useState([]);
  const [rosterLoading, setRosterLoading] = useState(APP_IN_PRODUCTION_MODE);

  const loginStaff = resolveEmployeeLoginStaff(staff, rosterStaff, APP_IN_PRODUCTION_MODE);
  const activeStaff = filterActiveLoginStaff(loginStaff);
  const pinOnlyLogin = APP_IN_PRODUCTION_MODE && Boolean(boundUserId);

  useEffect(() => {
    // Production employee login uses phone + PIN only; roster is not shown publicly.
    if (APP_IN_PRODUCTION_MODE) return;
    let cancelled = false;
    fetchEmployeeLoginRosterViaApi()
      .then((payload) => {
        if (cancelled) return;
        if (Array.isArray(payload?.staff)) {
          setRosterStaff(normalizeEmployeeLoginRosterStaff(payload));
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
    if (!selectedId && activeStaff[0]) setSelectedId(activeStaff[0].id);
  }, [activeStaff, selectedId]);

  useEffect(() => {
    const saved = readEmployeeCredentials();
    if (!saved) return;
    setRememberMe(true);
    if (saved.employeeId && isUuid(saved.employeeId)) {
      setBoundUserId(saved.employeeId);
    } else if (saved.employeeId && activeStaff.some((person) => (
      person.id === saved.employeeId
      || person.legacyId === saved.employeeId
      || person.apiUserId === saved.employeeId
    ))) {
      setSelectedId(saved.employeeId);
    } else if (saved.employeeId) {
      setManualEmployeeId(saved.employeeId);
    }
    if (saved.pin) setPin(saved.pin);
  }, [activeStaff]);

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
        const person = activeStaff.find((item) => (
          item.id === sessionUserId
          || item.legacyId === sessionUserId
          || item.apiUserId === sessionUserId
        ));
        onLogin(
          person?.id || sessionUserId,
          sessionUserId,
          person || null,
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

    const employeeIdentifier = pinOnlyLogin
      ? boundUserId
      : (activeStaff.length > 0 ? selectedId : manualEmployeeId.trim());

    const person = activeStaff.find((item) => (
      item.id === employeeIdentifier
      || item.legacyId === employeeIdentifier
      || item.apiUserId === employeeIdentifier
    ));

    if (!employeeIdentifier) {
      setError(text(lang, "noActiveEmployee"));
      return;
    }

    if (!person || !employeePinMatches(person, pin, PROTOTYPE_EMPLOYEE_PIN_DEFAULT)) {
      setError(text(lang, "invalidEmployeePin"));
      return;
    }

    setError("");
    if (rememberMe) saveEmployeeCredentials({ employeeId: employeeIdentifier, pin: pin.trim() });
    else clearEmployeeCredentials();
    onLogin(person?.id || employeeIdentifier, "", person || null);
  }, [
    activeStaff,
    boundUserId,
    employeePhone,
    lang,
    manualEmployeeId,
    onLogin,
    pin,
    pinOnlyLogin,
    rememberMe,
    selectedId,
    submitting,
    trustDevice,
  ]);

  return {
    activeStaff,
    rosterLoading,
    pinOnlyLogin,
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
    rememberMe,
    setRememberMe,
    submit,
  };
}
