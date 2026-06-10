"use client";

import DailyCloseoutEntryFlow from "@/features/employee-closeouts/DailyCloseoutEntryFlow";
import OwnerCloseoutManagePanel from "@/features/owner-closeouts/OwnerCloseoutManagePanel";
import { useDailyCloseouts } from "@/features/daily-closeouts/DailyCloseoutsProvider";
import { formatCalendarDate } from "@/features/reports/client/report-period-labels";
import { formatDateTimeLabel } from "./prototype-runtime-date-helpers";

export function OwnerCloseoutEditFlow({
  lang,
  editCloseout,
  ownerActor,
  ownerNotebookTheme = "yellow",
  resolveSalesChannels = () => [],
  channelLabel,
  onCloseoutUpdated = async () => {},
  onClose,
}) {
  const { upsertCloseout, ownerEditCloseout } = useDailyCloseouts();

  if (!editCloseout) return null;

  return (
    <DailyCloseoutEntryFlow
      lang={lang}
      notebookTheme={ownerNotebookTheme || editCloseout.notebookTheme}
      closeout={editCloseout}
      salesChannels={resolveSalesChannels(editCloseout.storeId)}
      storeName={editCloseout.storeName}
      isOwnerEdit
      saving={false}
      channelLabel={channelLabel}
      onCancel={onClose}
      onSaveDraft={(draft) => upsertCloseout(draft)}
      onSubmit={async (nextCloseout) => {
        const updated = await ownerEditCloseout({ closeout: nextCloseout, employee: ownerActor });
        if (!updated || updated.ok === false) return;
        await onCloseoutUpdated(updated);
        onClose();
      }}
      findForStoreDate={() => null}
    />
  );
}

export function OwnerCloseoutModals({
  lang,
  ownerManageCloseout,
  ownerDisplayName,
  ownerNotebookTheme = "yellow",
  resolveSalesChannels = () => [],
  channelLabel,
  onCloseoutUpdated = async () => {},
  onCloseoutDeleted = async () => {},
  onClose,
  onOwnerEditCloseout,
  attachmentsApiEnabled = false,
  attachmentsApiOrganizationId = "",
  attachmentsApiActorUserId = "",
  attachmentsApiActorRole = "owner",
}) {
  const { deleteCloseout } = useDailyCloseouts();

  if (!ownerManageCloseout) return null;

  return (
    <OwnerCloseoutManagePanel
      lang={lang}
      closeout={ownerManageCloseout}
      formatCalendarDate={formatCalendarDate}
      formatDateTime={formatDateTimeLabel}
      attachmentsApiEnabled={attachmentsApiEnabled}
      attachmentsApiOrganizationId={attachmentsApiOrganizationId}
      attachmentsApiActorUserId={attachmentsApiActorUserId}
      attachmentsApiActorRole={attachmentsApiActorRole}
      onClose={onClose}
      onEdit={() => onOwnerEditCloseout?.(ownerManageCloseout)}
      onDelete={async () => {
        const confirmed = window.confirm(lang === "ar" ? "هل تريد حذف هذه التقفيلة نهائيًا؟" : "Delete this closeout permanently?");
        if (!confirmed) return;
        deleteCloseout(ownerManageCloseout.id);
        await onCloseoutDeleted(ownerManageCloseout);
        onClose();
      }}
    />
  );
}
