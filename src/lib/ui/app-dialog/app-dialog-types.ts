import type { ReactNode } from "react";
import type { DisplayLang } from "@/core/i18n/display-locale";

export type AppDialogMode = "alert" | "confirm";

export type AppDialogVariant = "danger" | "success" | "info" | "warning";

export type AppDialogOptions = {
  lang?: DisplayLang;
  title: string;
  description?: string;
  notice?: string;
  variant?: AppDialogVariant;
  confirmLabel?: string;
  cancelLabel?: string;
  mode?: AppDialogMode;
  children?: ReactNode;
};

export type AppDialogBridge = {
  alert: (options: AppDialogOptions) => Promise<void>;
  confirm: (options: AppDialogOptions) => Promise<boolean>;
};

export type AppDialogQueueItem = {
  options: AppDialogOptions;
  resolve: (value: boolean) => void;
};

export type AppDialogContextValue = {
  lang: DisplayLang;
  showDialog: (options: AppDialogOptions) => Promise<boolean>;
};

export type AppActionSheetProps = {
  lang?: DisplayLang;
  open?: boolean;
  mode?: AppDialogMode;
  variant?: AppDialogVariant;
  title: string;
  description?: string;
  notice?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  children?: ReactNode;
};

export type AppDialogProviderProps = {
  lang?: DisplayLang;
  children: ReactNode;
};

export type TextFn = (lang: DisplayLang, key: string) => string;

export type ShowAppAlertOptions = Omit<AppDialogOptions, "lang" | "title" | "variant"> & {
  variant?: AppDialogVariant;
};

export type ConfirmCloseoutSubmitOptions = {
  isOwnerEdit?: boolean;
};
