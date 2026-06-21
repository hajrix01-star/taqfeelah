import type {
  AppDialogBridge,
  AppDialogOptions,
} from "@/lib/ui/app-dialog/app-dialog-types";

let activeBridge: AppDialogBridge | null = null;

function fallbackAlert(options: AppDialogOptions): Promise<void> {
  const message = [options.title, options.description].filter(Boolean).join("\n\n");
  window.alert(message);
  return Promise.resolve();
}

function fallbackConfirm(options: AppDialogOptions): Promise<boolean> {
  const message = [options.title, options.description].filter(Boolean).join("\n\n");
  return Promise.resolve(window.confirm(message));
}

function getFallbackBridge(): AppDialogBridge {
  return {
    alert: fallbackAlert,
    confirm: fallbackConfirm,
  };
}

export function installAppDialogBridge(bridge: AppDialogBridge | null): void {
  activeBridge = bridge;
}

export function getAppDialogBridge(): AppDialogBridge {
  return activeBridge || getFallbackBridge();
}

export function appAlert(options: AppDialogOptions): Promise<void> {
  return getAppDialogBridge().alert(options);
}

export function appConfirm(options: AppDialogOptions): Promise<boolean> {
  return getAppDialogBridge().confirm(options);
}

export type { AppDialogOptions, AppDialogBridge, AppDialogMode, AppDialogVariant } from "@/lib/ui/app-dialog/app-dialog-types";
