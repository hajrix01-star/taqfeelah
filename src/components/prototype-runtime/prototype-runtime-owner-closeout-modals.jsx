"use client";

import React, { useState } from "react";
import { useDailyCloseouts } from "@/features/daily-closeouts/DailyCloseoutsProvider";
import DailyCloseoutEntryFlow from "@/features/employee-closeouts/DailyCloseoutEntryFlow";
import OwnerCloseoutReviewPanel from "@/features/owner-closeout-review/OwnerCloseoutReviewPanel";
import ReturnCloseoutModal from "@/features/owner-closeout-review/ReturnCloseoutModal";
import { formatCalendarDate } from "@/features/reports/client/report-period-labels";
import { formatDateTimeLabel } from "./prototype-runtime-date-helpers";

export function OwnerCloseoutModals({
  lang,
  ownerReviewCloseout,
  returnCloseoutTarget,
  ownerDisplayName,
  reviewWorkflowEnabled,
  ownerNotebookTheme = "yellow",
  resolveSalesChannels = () => [],
  channelLabel,
  onCloseoutUpdated = async () => {},
  onCloseoutDeleted = async () => {},
  onCloseReview,
  onRequestReturn,
}) {
  const { approveCloseout, returnCloseout, upsertCloseout, deleteCloseout } = useDailyCloseouts();
  const [editCloseout, setEditCloseout] = useState(null);

  if (editCloseout) {
    return (
      <DailyCloseoutEntryFlow
        lang={lang}
        notebookTheme={editCloseout.notebookTheme || ownerNotebookTheme}
        closeout={editCloseout}
        salesChannels={resolveSalesChannels(editCloseout.storeId)}
        storeName={editCloseout.storeName}
        isResubmit={false}
        saving={false}
        channelLabel={channelLabel}
        onCancel={() => setEditCloseout(null)}
        onSaveDraft={(draft) => setEditCloseout(draft)}
        onSubmit={async (nextCloseout) => {
          const updated = upsertCloseout(nextCloseout);
          await onCloseoutUpdated(updated);
          setEditCloseout(null);
          onCloseReview();
        }}
        findForStoreDate={() => null}
      />
    );
  }

  return (
    <>
      <OwnerCloseoutReviewPanel
        lang={lang}
        closeout={ownerReviewCloseout}
        formatCalendarDate={formatCalendarDate}
        formatDateTime={formatDateTimeLabel}
        reviewWorkflowEnabled={reviewWorkflowEnabled}
        onClose={onCloseReview}
        onApprove={async () => {
          if (!ownerReviewCloseout) return;
          const approved = await approveCloseout(ownerReviewCloseout.id, ownerDisplayName);
          if (!approved) {
            window.alert(lang === "ar" ? "تعذر اعتماد التقفيلة على الخادم." : "Failed to approve closeout on server.");
            return;
          }
          await onCloseoutUpdated(approved);
          onCloseReview();
        }}
        onReturn={() => {
          if (!ownerReviewCloseout) return;
          onRequestReturn(ownerReviewCloseout);
        }}
        onEdit={() => {
          if (!ownerReviewCloseout) return;
          setEditCloseout(ownerReviewCloseout);
        }}
        onDelete={async () => {
          if (!ownerReviewCloseout) return;
          const confirmed = window.confirm(lang === "ar" ? "هل تريد حذف هذه التقفيلة نهائيًا؟" : "Delete this closeout permanently?");
          if (!confirmed) return;
          deleteCloseout(ownerReviewCloseout.id);
          await onCloseoutDeleted(ownerReviewCloseout);
          onCloseReview();
        }}
      />
      <ReturnCloseoutModal
        lang={lang}
        open={Boolean(returnCloseoutTarget)}
        closeout={returnCloseoutTarget}
        onCancel={onCloseReview}
        onConfirm={async (reason) => {
          if (!returnCloseoutTarget) return;
          const returned = await returnCloseout(returnCloseoutTarget.id, ownerDisplayName, reason);
          if (!returned) {
            window.alert(lang === "ar" ? "تعذر إرجاع التقفيلة على الخادم." : "Failed to return closeout on server.");
            return;
          }
          await onCloseoutUpdated(returned);
          onCloseReview();
        }}
      />
    </>
  );
}
