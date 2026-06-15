/** @typedef {"alert" | "confirm"} AppDialogMode */
/** @typedef {"danger" | "success" | "info" | "warning"} AppDialogVariant */

/**
 * @typedef {object} AppDialogOptions
 * @property {"ar" | "en"} [lang]
 * @property {string} title
 * @property {string} [description]
 * @property {string} [notice]
 * @property {AppDialogVariant} [variant]
 * @property {string} [confirmLabel]
 * @property {string} [cancelLabel]
 */

/**
 * @typedef {object} AppDialogBridge
 * @property {(options: AppDialogOptions) => Promise<void>} alert
 * @property {(options: AppDialogOptions) => Promise<boolean>} confirm
 */

/** @type {AppDialogBridge | null} */
let activeBridge = null;

function fallbackAlert(options) {
  const message = [options.title, options.description].filter(Boolean).join("\n\n");
  window.alert(message);
  return Promise.resolve();
}

function fallbackConfirm(options) {
  const message = [options.title, options.description].filter(Boolean).join("\n\n");
  return Promise.resolve(window.confirm(message));
}

/** @returns {AppDialogBridge} */
function getFallbackBridge() {
  return {
    alert: fallbackAlert,
    confirm: fallbackConfirm,
  };
}

/** @param {AppDialogBridge | null} bridge */
export function installAppDialogBridge(bridge) {
  activeBridge = bridge;
}

/** @returns {AppDialogBridge} */
export function getAppDialogBridge() {
  return activeBridge || getFallbackBridge();
}

/** @param {AppDialogOptions} options */
export function appAlert(options) {
  return getAppDialogBridge().alert(options);
}

/** @param {AppDialogOptions} options */
export function appConfirm(options) {
  return getAppDialogBridge().confirm(options);
}
