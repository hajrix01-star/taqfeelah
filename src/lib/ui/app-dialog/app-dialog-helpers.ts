import { appAlert, appConfirm } from "./app-dialog-bridge";
import type { DisplayLang } from "@/core/i18n/display-locale";
import type {
  ConfirmCloseoutSubmitOptions,
  ShowAppAlertOptions,
  TextFn,
} from "@/lib/ui/app-dialog/app-dialog-types";
import type { AppDialogOptions } from "@/lib/ui/app-dialog/app-dialog-types";

export function showAppAlert(
  lang: DisplayLang,
  title: string,
  options: ShowAppAlertOptions = {},
): Promise<void> {
  return appAlert({ lang, title, variant: "info", ...options });
}

export function showAppConfirm(
  lang: DisplayLang,
  options: AppDialogOptions,
): Promise<boolean> {
  return appConfirm({ lang, ...options });
}

export async function confirmCloseoutDelete(lang: DisplayLang, textFn: TextFn): Promise<boolean> {
  return appConfirm({
    lang,
    title: textFn(lang, "closeoutDeletePermanentlyTitle"),
    description: textFn(lang, "closeoutDeletePermanentlyDesc"),
    confirmLabel: textFn(lang, "delete"),
    cancelLabel: textFn(lang, "cancel"),
    variant: "danger",
  });
}

export async function confirmCloseoutSubmit(
  lang: DisplayLang,
  textFn: TextFn,
  { isOwnerEdit = false }: ConfirmCloseoutSubmitOptions = {},
): Promise<boolean> {
  return appConfirm({
    lang,
    title: textFn(lang, isOwnerEdit ? "confirmCloseoutEditTitle" : "confirmCloseoutSubmitTitle"),
    description: textFn(lang, isOwnerEdit ? "confirmCloseoutEditDesc" : "confirmCloseoutSubmitDesc"),
    confirmLabel: textFn(lang, isOwnerEdit ? "saveCloseoutChanges" : "saveAndSend"),
    cancelLabel: textFn(lang, "cancel"),
    variant: "info",
  });
}

export async function alertCloseoutNotFound(lang: DisplayLang, textFn: TextFn): Promise<void> {
  return appAlert({
    lang,
    title: textFn(lang, "closeoutNotFound"),
    variant: "warning",
  });
}

export async function alertCloseoutNotFoundForEntry(lang: DisplayLang, textFn: TextFn): Promise<void> {
  return appAlert({
    lang,
    title: textFn(lang, "closeoutNotFoundForEntry"),
    variant: "warning",
  });
}
