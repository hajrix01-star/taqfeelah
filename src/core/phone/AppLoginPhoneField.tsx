"use client";

import { LoginPhoneFields } from "@/core/phone/LoginPhoneFields";

type AppLoginPhoneFieldProps = {
  value: string;
  onChange: (nextValue: string) => void;
  disabled?: boolean;
  className?: string;
};

export function AppLoginPhoneField({
  value,
  onChange,
  disabled = false,
  className = "",
}: AppLoginPhoneFieldProps) {
  return (
    <LoginPhoneFields
      value={value}
      onChange={onChange}
      disabled={disabled}
      variant="app"
      containerClassName={`flex items-stretch overflow-hidden rounded-2xl bg-[#F7F5EF] ring-1 ring-[#E8E1D4] ${className}`.trim()}
    />
  );
}
