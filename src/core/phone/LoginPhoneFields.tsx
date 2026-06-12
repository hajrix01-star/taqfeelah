"use client";

import { composeLoginPhone, DEFAULT_DIAL_CODE, splitLoginPhone } from "@/core/phone/split-login-phone";

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
};

export function LoginPhoneFields({
  value,
  onChange,
  dialCode,
  onDialCodeChange,
  disabled = false,
  nationalPlaceholder = "5xxxxxxxx",
  dialClassName = "w-24 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 py-2 text-sm",
  nationalClassName = "min-w-0 flex-1 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 py-2 text-sm",
  containerClassName = "flex gap-2",
}: LoginPhoneFieldsProps) {
  const split = splitLoginPhone(value);
  const resolvedDialCode = dialCode ?? split.dialCode ?? DEFAULT_DIAL_CODE;
  const nationalNumber = split.nationalNumber;

  function handleDialChange(nextDial: string) {
    onDialCodeChange?.(nextDial);
    onChange(composeLoginPhone(nextDial, nationalNumber));
  }

  function handleNationalChange(nextNational: string) {
    onChange(composeLoginPhone(resolvedDialCode, nextNational));
  }

  return (
    <div className={containerClassName}>
      <input
        dir="ltr"
        value={resolvedDialCode}
        onChange={(event) => handleDialChange(event.target.value)}
        disabled={disabled}
        aria-label="Country dial code"
        className={dialClassName}
      />
      <input
        dir="ltr"
        inputMode="tel"
        autoComplete="tel-national"
        value={nationalNumber}
        onChange={(event) => handleNationalChange(event.target.value)}
        disabled={disabled}
        placeholder={nationalPlaceholder}
        className={nationalClassName}
      />
    </div>
  );
}
