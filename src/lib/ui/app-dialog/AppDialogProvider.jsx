"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { AppActionSheet } from "./AppActionSheet";
import { appAlert, appConfirm, installAppDialogBridge } from "./app-dialog-bridge";

const AppDialogContext = createContext(null);

export function AppDialogProvider({ lang = "ar", children }) {
  const langRef = useRef(lang);
  langRef.current = lang;

  /** @type {import("react").RefObject<Array<{ options: object, resolve: (value: boolean) => void }>>} */
  const queueRef = useRef([]);
  const resolveRef = useRef(null);
  const activeRef = useRef(false);
  const [dialog, setDialog] = useState(null);

  const openNextFromQueue = useCallback(() => {
    if (activeRef.current) return;
    const next = queueRef.current.shift();
    if (!next) return;
    activeRef.current = true;
    resolveRef.current = next.resolve;
    setDialog(next.options);
  }, []);

  const closeDialog = useCallback((result) => {
    resolveRef.current?.(result);
    resolveRef.current = null;
    activeRef.current = false;
    setDialog(null);
  }, []);

  useEffect(() => {
    if (dialog) return;
    openNextFromQueue();
  }, [dialog, openNextFromQueue]);

  const showDialog = useCallback((options) => {
    const normalized = {
      ...options,
      lang: options.lang || langRef.current,
    };
    return new Promise((resolve) => {
      queueRef.current.push({ options: normalized, resolve });
      openNextFromQueue();
    });
  }, [openNextFromQueue]);

  useEffect(() => {
    installAppDialogBridge({
      alert: (options) => showDialog({ ...options, mode: "alert" }).then(() => {}),
      confirm: (options) => showDialog({ ...options, mode: "confirm" }),
    });
    return () => installAppDialogBridge(null);
  }, [showDialog]);

  const handleConfirm = useCallback(() => {
    closeDialog(dialog?.mode === "confirm");
  }, [closeDialog, dialog?.mode]);

  const handleCancel = useCallback(() => {
    closeDialog(false);
  }, [closeDialog]);

  const portal = typeof document !== "undefined" && dialog
    ? createPortal(
      <AppActionSheet
        lang={dialog.lang}
        open
        mode={dialog.mode}
        variant={dialog.variant || (dialog.mode === "confirm" ? "danger" : "info")}
        title={dialog.title}
        description={dialog.description || ""}
        notice={dialog.notice || ""}
        confirmLabel={dialog.confirmLabel || ""}
        cancelLabel={dialog.cancelLabel || ""}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      >
        {dialog.children || null}
      </AppActionSheet>,
      document.body,
    )
    : null;

  return (
    <AppDialogContext.Provider value={{ lang: langRef.current, showDialog }}>
      {children}
      {portal}
    </AppDialogContext.Provider>
  );
}

export function useAppDialog() {
  const context = useContext(AppDialogContext);
  return {
    alert: (options) => (
      context
        ? context.showDialog({ ...options, mode: "alert" }).then(() => {})
        : appAlert(options)
    ),
    confirm: (options) => (
      context
        ? context.showDialog({ ...options, mode: "confirm" })
        : appConfirm(options)
    ),
  };
}
