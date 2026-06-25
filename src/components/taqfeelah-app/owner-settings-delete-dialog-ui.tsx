"use client";

import { AnimatePresence } from "framer-motion";
import { AppActionSheet } from "@/lib/ui/app-dialog/AppActionSheet";
import { buildOwnerSettingsDeleteDialog } from "@/features/org-config/client/owner-settings-delete-dialog";
import type { OwnerSettingsDeleteDialogProps } from "./taqfeelah-app-types";

export function OwnerSettingsDeleteDialog({ lang, deleteTarget, onCancel, onConfirm, translate }: OwnerSettingsDeleteDialogProps) {
  const deleteDialog = buildOwnerSettingsDeleteDialog(deleteTarget, translate);
  if (!deleteDialog) return null;

  return (
    <AnimatePresence>
      <AppActionSheet
        lang={lang}
        open
        mode="confirm"
        variant="danger"
        title={deleteDialog.title}
        description={deleteDialog.desc}
        confirmLabel={deleteDialog.action}
        cancelLabel={translate("cancel")}
        onConfirm={onConfirm}
        onCancel={onCancel}
      >
        {deleteTarget?.affectedStaff?.length ? (
          <div className="mt-3 rounded-2xl bg-[#FFF1EE] p-3 text-taq-meta font-bold leading-5 text-[#B44747]">
            <p>{translate("archiveStaffWarning")}</p>
            <p className="mt-1">
              {deleteTarget.affectedStaff.map((person) => (lang === "ar" ? person.nameAr : person.nameEn)).join(" · ")}
            </p>
          </div>
        ) : null}
      </AppActionSheet>
    </AnimatePresence>
  );
}
