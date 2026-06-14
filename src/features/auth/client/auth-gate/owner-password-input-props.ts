import type { InputHTMLAttributes } from "react";

export const ownerPasswordInputProps: Pick<InputHTMLAttributes<HTMLInputElement>, "inputMode" | "pattern"> = {
  inputMode: "numeric",
  pattern: "[0-9]*",
};
