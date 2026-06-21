"use client";

import DailyCloseoutEntryFlow from "@/features/employee-closeouts/DailyCloseoutEntryFlow";
import OwnerCloseoutManagePanel from "@/features/owner-closeouts/OwnerCloseoutManagePanel";
import { useDailyCloseouts } from "@/features/daily-closeouts/DailyCloseoutsProvider";
import { isCloseoutWorkflowFailure } from "@/features/daily-closeouts/daily-closeouts-demo-store";
import { formatCalendarDate } from "@/features/reports/client/report-period-labels";
import { formatDateTimeLabel } from "./prototype-runtime-date-helpers";
import { text } from "./prototype-runtime-demo-data";
import { confirmCloseoutDelete } from "@/lib/ui/app-dialog/app-dialog-helpers";
import type { DailyCloseoutRecord, SalesChannelConfig } from "@/features/daily-closeouts/daily-closeouts-types";
import type {
  OwnerCloseoutEditFlowProps,
  OwnerCloseoutModalsProps,
  PrototypeChannel,
} from "./prototype-runtime-types";

export function OwnerCloseoutEditFlow({
  lang,
  editCloseout,
  ownerActor,
  ownerNotebookTheme = "yellow",
  resolveSalesChannels = () => [],
  channelLabel,
  onCloseoutUpdated = async () => {},
  onClose,
}: OwnerCloseoutEditFlowProps) {
  const { ownerEditCloseout } = useDailyCloseouts();

  if (!editCloseout) return null;

  const resolvedChannelLabel = channelLabel
    || ((channel: SalesChannelConfig) => String(channel.displayName || channel.id || ""));

  return (
    <DailyCloseoutEntryFlow
      lang={lang}
      notebookTheme={ownerNotebookTheme || editCloseout.notebookTheme}
      closeout={editCloseout}
      salesChannels={resolveSalesChannels(String(editCloseout.storeId || "")) as SalesChannelConfig[]}
      storeName={editCloseout.storeName}
      isOwnerEdit
      saving={false}
      channelLabel={resolvedChannelLabel}
      onCancel={onClose}
      onSubmit={async (nextCloseout) => {
        const updated = await ownerEditCloseout({ closeout: nextCloseout, employee: ownerActor });
        if (!updated || isCloseoutWorkflowFailure(updated)) return;
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
  ownerDisplayName: _ownerDisplayName,
  ownerNotebookTheme = "yellow",
  resolveSalesChannels: _resolveSalesChannels = () => [],
  channelLabel: _channelLabel,
  onCloseoutUpdated = async () => {},
  onCloseoutDeleted = async () => {},
  onClose,
  onOwnerEditCloseout,
  attachmentsApiEnabled = false,
  attachmentsApiOrganizationId = "",
  attachmentsApiActorUserId = "",
  attachmentsApiActorRole = "owner",
}: OwnerCloseoutModalsProps) {
  const { deleteCloseout } = useDailyCloseouts();

  if (!ownerManageCloseout) return null;

  return (
    <OwnerCloseoutManagePanel
      lang={lang}
      closeout={ownerManageCloseout as unknown as Parameters<typeof OwnerCloseoutManagePanel>[0]["closeout"]}
      formatCalendarDate={formatCalendarDate}
      formatDateTime={formatDateTimeLabel}
      attachmentsApiEnabled={attachmentsApiEnabled}
      attachmentsApiOrganizationId={attachmentsApiOrganizationId}
      attachmentsApiActorUserId={attachmentsApiActorUserId}
      attachmentsApiActorRole={attachmentsApiActorRole}
      onClose={onClose}
      onEdit={() => onOwnerEditCloseout?.(ownerManageCloseout)}
      onDelete={async () => {
        if (!(await confirmCloseoutDelete(lang, text))) return;
        deleteCloseout(String(ownerManageCloseout.id || ""), ownerManageCloseout);
        await onCloseoutDeleted(ownerManageCloseout);
        onClose();
      }}
    />
  );
}
