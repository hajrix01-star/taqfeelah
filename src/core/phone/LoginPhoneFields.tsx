"use client";

import {
  composeLoginPhone,
  DEFAULT_DIAL_CODE,
  sanitizeNationalPhoneInput,
  splitLoginPhone,
} from "@/core/phone/split-login-phone";

type LoginPhoneFieldsProps = {
  value: string;
  onChange: (nextValue: string) => void;
  dialCode?: string;
  onDialCodeChange?: (nextDialCode: string) => void;
  disabled?: boolean;
  nationalPlaceholder?: string;
  dialClassName?: string;
  nationalClassName?: string;
  containerClassName?: string;
  /** App login screens: fixed +966 with Saudi flag and shared styling. */
  variant?: "admin" | "app";
  lockDialCode?: boolean;
  required?: boolean;
};

const APP_DIAL_CLASS = "flex shrink-0 items-center gap-2 border-r border-[#DDD3C0] px-3 py-3.5 text-sm font-black text-[#112A46]";
const APP_NATIONAL_CLASS = "min-w-0 flex-1 bg-transparent px-3 py-3.5 text-sm font-black outline-none";
const ADMIN_DIAL_CLASS = "w-24 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 py-2 text-sm";
const ADMIN_NATIONAL_CLASS = "min-w-0 flex-1 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 py-2 text-sm";

function SaudiFlag({ className = "text-base leading-none" }: { className?: string }) {
  return (
    <span className={className} aria-hidden="true" role="img">
      🇸🇦
    </span>
  );
}

export function LoginPhoneFields({
  value,
  onChange,
  dialCode,
  onDialCodeChange,
  disabled = false,
  nationalPlaceholder,
  dialClassName,
  nationalClassName,
  containerClassName,
  variant = "admin",
  lockDialCode: lockDialCodeProp,
  required = false,
}: LoginPhoneFieldsProps) {
  const isAppVariant = variant === "app";
  const split = splitLoginPhone(value);
  const resolvedDialCode = dialCode ?? split.dialCode ?? DEFAULT_DIAL_CODE;
  const nationalNumber = split.nationalNumber;
  const lockDialCode = lockDialCodeProp ?? isAppVariant;
  const resolvedNationalPlaceholder = nationalPlaceholder ?? (isAppVariant ? "5XX XXX XXXX" : "5xxxxxxxx");
  const resolvedContainerClassName = containerClassName ?? (isAppVariant ? "" : "flex gap-2");
  const resolvedDialClassName = dialClassName ?? (isAppVariant ? APP_DIAL_CLASS : ADMIN_DIAL_CLASS);
  const resolvedNationalClassName = nationalClassName ?? (isAppVariant ? APP_NATIONAL_CLASS : ADMIN_NATIONAL_CLASS);

  function handleDialChange(nextDial: string) {
    onDialCodeChange?.(nextDial);
    onChange(composeLoginPhone(nextDial, nationalNumber));
  }

  function handleNationalChange(nextNational: string) {
    const sanitized = sanitizeNationalPhoneInput(nextNational, resolvedDialCode);
    onChange(composeLoginPhone(resolvedDialCode, sanitized));
  }

  return (
    <div dir="ltr" className={resolvedContainerClassName}>
      {lockDialCode ? (
        <div className={resolvedDialClassName}>
          <SaudiFlag className={isAppVariant ? "text-base leading-none" : "text-sm leading-none"} />
          <span>{resolvedDialCode}</span>
        </div>
      ) : (
        <input
          dir="ltr"
          value={resolvedDialCode}
          onChange={(event) => handleDialChange(event.target.value)}
          disabled={disabled}
          aria-label="Country dial code"
          className={resolvedDialClassName}
        />
      )}
      <input
        dir="ltr"
        inputMode="tel"
        autoComplete="tel-national"
        value={nationalNumber}
        onChange={(event) => handleNationalChange(event.target.value)}
        disabled={disabled}
        required={required}
        placeholder={resolvedNationalPlaceholder}
        aria-label="Mobile number"
        className={resolvedNationalClassName}
      />
    </div>
  );
}
