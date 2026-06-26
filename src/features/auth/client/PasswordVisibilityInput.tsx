"use client";

import { useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";

type PasswordVisibilityInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  wrapperClassName?: string;
  toggleClassName?: string;
  showLabel?: string;
  hideLabel?: string;
};

export function PasswordVisibilityInput({
  className = "",
  wrapperClassName = "",
  toggleClassName = "",
  showLabel = "Show password",
  hideLabel = "Hide password",
  ...props
}: PasswordVisibilityInputProps) {
  const [visible, setVisible] = useState(false);
  const Icon = visible ? EyeOff : Eye;

  return (
    <div className={`relative ${wrapperClassName}`}>
      <input
        {...props}
        type={visible ? "text" : "password"}
        className={`${className} pr-12`}
      />
      <button
        type="button"
        aria-label={visible ? hideLabel : showLabel}
        title={visible ? hideLabel : showLabel}
        onClick={() => setVisible((current) => !current)}
        className={`absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-[#716753] transition hover:bg-black/[0.04] focus:outline-none focus:ring-2 focus:ring-[#B99844]/40 ${toggleClassName}`}
      >
        <Icon aria-hidden="true" className="h-4 w-4" />
      </button>
    </div>
  );
}
