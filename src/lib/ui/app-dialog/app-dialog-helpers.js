import { appAlert, appConfirm } from "./app-dialog-bridge";

/**
 * @param {"ar" | "en"} lang
 * @param {string} title
 * @param {import("./app-dialog-bridge").AppDialogOptions} [options]
 */
export function showAppAlert(lang, title, options = {}) {
  return appAlert({ lang, title, variant: "info", ...options });
}

/**
 * @param {"ar" | "en"} lang
 * @param {import("./app-dialog-bridge").AppDialogOptions} options
 */
export function showAppConfirm(lang, options) {
  return appConfirm({ lang, ...options });
}

/**
 * @param {"ar" | "en"} lang
 * @param {(lang: "ar" | "en", key: string) => string} textFn
 */
export async function confirmCloseoutDelete(lang, textFn) {
  return appConfirm({
    lang,
    title: textFn(lang, "closeoutDeletePermanentlyTitle"),
    description: textFn(lang, "closeoutDeletePermanentlyDesc"),
    confirmLabel: textFn(lang, "delete"),
    cancelLabel: textFn(lang, "cancel"),
    variant: "danger",
  });
}

/**
 * @param {"ar" | "en"} lang
 * @param {(lang: "ar" | "en", key: string) => string} textFn
 * @param {{ isOwnerEdit?: boolean }} [options]
 */
export async function confirmCloseoutSubmit(lang, textFn, { isOwnerEdit = false } = {}) {
  return appConfirm({
    lang,
    title: textFn(lang, isOwnerEdit ? "confirmCloseoutEditTitle" : "confirmCloseoutSubmitTitle"),
    description: textFn(lang, isOwnerEdit ? "confirmCloseoutEditDesc" : "confirmCloseoutSubmitDesc"),
    confirmLabel: textFn(lang, isOwnerEdit ? "saveCloseoutChanges" : "saveAndSend"),
    cancelLabel: textFn(lang, "cancel"),
    variant: "info",
  });
}

/**
 * @param {"ar" | "en"} lang
 * @param {(lang: "ar" | "en", key: string) => string} textFn
 */
export async function alertCloseoutNotFound(lang, textFn) {
  return appAlert({
    lang,
    title: textFn(lang, "closeoutNotFound"),
    variant: "warning",
  });
}

/**
 * @param {"ar" | "en"} lang
 * @param {(lang: "ar" | "en", key: string) => string} textFn
 */
export async function alertCloseoutNotFoundForEntry(lang, textFn) {
  return appAlert({
    lang,
    title: textFn(lang, "closeoutNotFoundForEntry"),
    variant: "warning",
  });
}
