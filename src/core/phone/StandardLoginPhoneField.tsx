"use client";

import { LoginPhoneFields } from "@/core/phone/LoginPhoneFields";

export type StandardLoginPhoneSurface = "admin" | "owner" | "activation";

type StandardLoginPhoneFieldProps = {
  value: string;
  onChange: (nextValue: string) => void;
  disabled?: boolean;
  /** Visual preset — all surfaces lock +966 with Saudi flag. */
  surface?: StandardLoginPhoneSurface;
};

const SURFACE_PRESETS: Record<StandardLoginPhoneSurface, {
  containerClassName: string;
  dialClassName: string;
  nationalClassName: string;
  nationalPlaceholder: string;
}> = {
  admin: {
    containerClassName: "flex items-stretch overflow-hidden rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)]",
    dialClassName: "flex shrink-0 items-center gap-1.5 border-r border-[var(--admin-border)] bg-[var(--admin-surface-muted)] px-3 py-2 text-sm font-semibold text-[var(--admin-text)]",
    nationalClassName: "min-w-0 flex-1 bg-[var(--admin-surface)] px-3 py-2 text-sm outline-none",
    nationalPlaceholder: "5XXXXXXXX",
  },
  owner: {
    containerClassName: "flex items-stretch overflow-hidden rounded-2xl bg-[#F7F5EF] ring-1 ring-[#E8E1D4]",
    dialClassName: "flex shrink-0 items-center gap-1.5 border-r border-[#DDD3C0] px-3 py-3 text-xs font-black text-[#112A46]",
    nationalClassName: "min-w-0 flex-1 bg-transparent px-4 py-3 text-xs font-bold outline-none",
    nationalPlaceholder: "5XXXXXXXX",
  },
  activation: {
    containerClassName: "flex items-stretch overflow-hidden rounded-2xl bg-[#F7F5EF] ring-1 ring-[#E8E1D4]",
    dialClassName: "flex shrink-0 items-center gap-2 border-r border-[#DDD3C0] px-3 py-3.5 text-sm font-black text-[#112A46]",
    nationalClassName: "min-w-0 flex-1 bg-transparent px-3 py-3.5 text-sm font-black outline-none",
    nationalPlaceholder: "5XX XXX XXXX",
  },
};

/**
 * Single entry point for Saudi mobile inputs outside login screens.
 * Fixed +966 dial code, Saudi flag, national number only.
 */
export function StandardLoginPhoneField({
  value,
  onChange,
  disabled = false,
  surface = "admin",
}: StandardLoginPhoneFieldProps) {
  const preset = SURFACE_PRESETS[surface];

  return (
    <LoginPhoneFields
      value={value}
      onChange={onChange}
      disabled={disabled}
      lockDialCode
      variant="admin"
      containerClassName={preset.containerClassName}
      dialClassName={preset.dialClassName}
      nationalClassName={preset.nationalClassName}
      nationalPlaceholder={preset.nationalPlaceholder}
    />
  );
}
