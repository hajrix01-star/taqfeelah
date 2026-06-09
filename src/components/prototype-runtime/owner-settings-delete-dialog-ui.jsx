"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Trash2, X } from "lucide-react";
import { buildOwnerSettingsDeleteDialog } from "@/features/org-config/client/owner-settings-delete-dialog";

export function OwnerSettingsDeleteDialog({ lang, deleteTarget, onCancel, onConfirm, translate }) {
  const deleteDialog = buildOwnerSettingsDeleteDialog(deleteTarget, translate);
  if (!deleteDialog) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="owner-settings-delete-dialog"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 z-50 flex items-end bg-[#112A46]/45 sm:items-center sm:justify-center sm:p-6 lg:items-end lg:justify-start lg:p-0"
      >
        <motion.div
          initial={{ y: 20 }}
          animate={{ y: 0 }}
          exit={{ y: 20 }}
          className="relative z-10 w-full rounded-t-[30px] bg-[#F8F6F0] p-5 pb-8 sm:max-w-[560px] sm:rounded-[30px] sm:p-6 lg:max-w-none lg:rounded-t-[30px] lg:rounded-b-none lg:p-5 lg:pb-8"
        >
          <div className="mb-4 flex items-start justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FFF1EE] text-[#B44747]">
              <Trash2 className="h-5 w-5" />
            </div>
            <button onClick={onCancel} className="flex h-9 w-9 items-center justify-center rounded-xl bg-white">
              <X className="h-4 w-4" />
            </button>
          </div>
          <h3 className="text-base font-black">{deleteDialog.title}</h3>
          <p className="mt-2 text-taq-meta font-bold leading-6 text-[#716753]">{deleteDialog.desc}</p>
          <div className="mt-4 rounded-2xl bg-[#FFF4D2] p-3 text-taq-meta font-bold leading-5 text-[#806528]">
            {translate("safeDeleteNotice")}
          </div>
          {deleteTarget?.affectedStaff?.length > 0 && (
            <div className="mt-3 rounded-2xl bg-[#FFF1EE] p-3 text-taq-meta font-bold leading-5 text-[#B44747]">
              <p>{translate("archiveStaffWarning")}</p>
              <p className="mt-1">
                {deleteTarget.affectedStaff.map((person) => (lang === "ar" ? person.nameAr : person.nameEn)).join(" · ")}
              </p>
            </div>
          )}
          <div className="mt-5 grid grid-cols-[0.9fr_1.35fr] gap-3">
            <button onClick={onCancel} className="rounded-2xl bg-white py-3.5 text-xs font-black ring-1 ring-black/[0.06]">
              {translate("cancel")}
            </button>
            <button onClick={onConfirm} className="rounded-2xl bg-[#B44747] py-3.5 text-xs font-black text-white">
              {deleteDialog.action}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
