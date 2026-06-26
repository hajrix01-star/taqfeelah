"use client";

import { useCallback, useMemo } from "react";
import { useDailyCloseouts } from "@/features/daily-closeouts/DailyCloseoutsProvider";
import { resolveSelectedCloseoutOwnerEditSource } from "@/features/closeouts/client/closeout-owner-edit-display";
import {
  buildRegisterCloseoutResolveOptions,
  resolveRegisterCloseoutFromEntry,
} from "@/features/closeouts/client/register-closeout-resolution";
import { resolveCloseoutRecordForRegisterSummary } from "@/features/closeouts/client/register-closeout-summary-service";
import { useRegisterEntriesCatalog } from "@/features/operations/client/use-register-entries-catalog";
import { resolveCloseoutForOperationalEntry } from "@/features/operations/client/register-operations-selection";
import { useResolvedSelectedOperation } from "@/features/operations/client/use-resolved-selected-operation";
import {
  DuplicateSalesDialog,
  OperationModal,
  QuickAddSheet,
  RestoreOperationDialog,
  SavedOutflowShareDialog,
  VoidOperationDialog,
} from "./taqfeelah-app-operation-dialogs";
import { BottomNav } from "./taqfeelah-app-chrome";
import { HelpCenterSheet } from "./AuthGateSection";
import { NotebookShareModal } from "./taqfeelah-app-notebook-share-modal";
import { OwnerCloseoutEditFlow, OwnerCloseoutModals } from "./taqfeelah-app-owner-closeout-modals";
import { text } from "./taqfeelah-app-catalog-data";
import { alertCloseoutNotFoundForEntry, alertCloseoutNotFound } from "@/lib/ui/app-dialog/app-dialog-helpers";
import type { OperationalEntry, AppBusiness, AppChannel, NotebookShareSnapshot } from "./taqfeelah-app-types";
import type { TaqfeelahAppOverlayStackProps, AppCloseoutRecord } from "./taqfeelah-app-types";
import type { DailyCloseoutRecord } from "@/features/daily-closeouts/daily-closeouts-types";

export function TaqfeelahAppOverlayStack({
  lang,
  employee,
  employeePage,
  ownerPage,
  employeeEntryActive,
  ownerEntryActive,
  employeeAddHandlerRef,
  handleOwnerQuickAddOpen,
  changeEmployeePage,
  changeOwnerPage,
  setQuickAddOpen,
  quickAddOpen,
  handleOpenQuickAddSummary,
  handleOpenQuickAddExpense,
  selected,
  setSelected,
  requestVoidOperation,
  requestRestoreOperation,
  archivedBusinessIds,
  entryAttachmentsApiProps,
  pendingDuplicateSummary,
  setPendingDuplicateSummary,
  activeBusinesses,
  confirmDuplicateSummary,
  voidTarget,
  setVoidTarget,
  confirmVoidOperation,
  restoreTarget,
  setRestoreTarget,
  confirmRestoreOperation,
  savedOutflowShareTarget,
  setSavedOutflowShareTarget,
  shareSnapshot,
  setShareSnapshot,
  reportingBusinesses,
  operationalEntries,
  phase9ApiEnabled,
  entriesApiEnabled,
  closeoutsApiEnabled = false,
  runtimeApiAuth,
  ownerManageCloseout,
  ownerDisplayName,
  notebookTheme,
  resolveStoreSalesChannels,
  channelName,
  handleOwnerCloseoutUpdated,
  handleOwnerCloseoutDeleted,
  setOwnerManageCloseout,
  ownerEditCloseout,
  setOwnerEditCloseout,
  ownerCloseoutActor,
  ownerCloseoutAttachmentsApiProps,
  helpOpen,
  setHelpOpen,
}: TaqfeelahAppOverlayStackProps) {
  const { closeouts, reloadCloseoutsFromApi } = useDailyCloseouts();
  const registerEntriesCatalog = useRegisterEntriesCatalog();
  const entryCatalogs = useMemo(
    () => [operationalEntries, registerEntriesCatalog],
    [operationalEntries, registerEntriesCatalog],
  );
  const resolvedSelected = useResolvedSelectedOperation(selected, entryCatalogs);

  const selectedOwnerEditSource = useMemo(
    () => resolveSelectedCloseoutOwnerEditSource(
      resolvedSelected,
      closeouts as Parameters<typeof resolveSelectedCloseoutOwnerEditSource>[1],
      resolveCloseoutForOperationalEntry as Parameters<typeof resolveSelectedCloseoutOwnerEditSource>[2],
    ),
    [closeouts, resolvedSelected],
  );

  const closeoutResolveOptions = useMemo(
    () => buildRegisterCloseoutResolveOptions({
      cachedCloseouts: closeouts as import("@/features/operations/client/operations-client-types").CloseoutRecord[],
      reloadCloseouts: async () => (
        await reloadCloseoutsFromApi()
      ) as import("@/features/operations/client/operations-client-types").CloseoutRecord[],
      apiContext: {
        enabled: Boolean(
          closeoutsApiEnabled
          && typeof runtimeApiAuth?.organizationId === "string" && runtimeApiAuth.organizationId
          && typeof runtimeApiAuth?.actorUserId === "string" && runtimeApiAuth.actorUserId,
        ),
        organizationId: typeof runtimeApiAuth?.organizationId === "string" ? runtimeApiAuth.organizationId : "",
        actorUserId: typeof runtimeApiAuth?.actorUserId === "string" ? runtimeApiAuth.actorUserId : "",
        actorRole: typeof runtimeApiAuth?.actorRole === "string" ? runtimeApiAuth.actorRole : "owner",
      },
    }),
    [closeouts, closeoutsApiEnabled, reloadCloseoutsFromApi, runtimeApiAuth],
  );

  const handleEditOwnerCloseoutFromEntry = useCallback(async (entry: OperationalEntry) => {
    setSelected(null);
    const closeout = await resolveRegisterCloseoutFromEntry(entry, closeoutResolveOptions);
    if (!closeout) {
      await alertCloseoutNotFoundForEntry(lang, text);
      return;
    }
    setOwnerEditCloseout(closeout as AppCloseoutRecord);
  }, [closeoutResolveOptions, lang, setOwnerEditCloseout, setSelected]);

  const handleEditOwnerCloseoutFromManage = useCallback(async (closeout: DailyCloseoutRecord) => {
    setOwnerManageCloseout(null);
    const resolved = await resolveCloseoutRecordForRegisterSummary(
      {
        closeoutId: closeout.id,
        businessId: closeout.storeId,
        date: closeout.date,
      },
      closeoutResolveOptions,
    );
    if (!resolved) {
      await alertCloseoutNotFound(lang, text);
      return;
    }
    setOwnerEditCloseout(resolved as AppCloseoutRecord);
  }, [closeoutResolveOptions, lang, setOwnerEditCloseout, setOwnerManageCloseout]);

  const registerChannelLabel = useCallback(
    (channel: AppChannel | Record<string, unknown>) => (
      String((channel as AppChannel).displayName || channelName(channel as AppChannel, lang))
    ),
    [channelName, lang],
  );

  const resolveSalesChannelsForEdit = useCallback(
    (storeId: string) => resolveStoreSalesChannels(storeId) as AppChannel[],
    [resolveStoreSalesChannels],
  );

  return (
    <>
      {!(employee && employeeEntryActive) && !(!employee && ownerEntryActive) && !ownerEditCloseout && (
        <BottomNav
          lang={lang}
          employee={employee}
          active={employee ? employeePage : ownerPage}
          onAdd={() => {
            if (employee) employeeAddHandlerRef.current?.();
            else handleOwnerQuickAddOpen();
          }}
          onChange={(page) => {
            setQuickAddOpen(false);
            if (employee) changeEmployeePage(page);
            else changeOwnerPage(page);
          }}
        />
      )}
      {!employee && (
        <QuickAddSheet
          lang={lang}
          employee={false}
          open={quickAddOpen}
          onClose={() => setQuickAddOpen(false)}
          onSummary={handleOpenQuickAddSummary}
          onExpense={handleOpenQuickAddExpense}
        />
      )}
      {!ownerEditCloseout && (
        <OperationModal
          key={resolvedSelected?.id || "operation-modal"}
          lang={lang}
          item={resolvedSelected}
          onClose={() => setSelected(null)}
          onVoid={requestVoidOperation}
          onRestore={requestRestoreOperation}
          onEditOwnerCloseout={!employee ? handleEditOwnerCloseoutFromEntry : undefined}
          ownerEditSource={selectedOwnerEditSource}
          canVoid={Boolean(resolvedSelected?.businessId) && !archivedBusinessIds.includes(String(resolvedSelected?.businessId))}
          canRestore={Boolean(resolvedSelected?.businessId) && !archivedBusinessIds.includes(String(resolvedSelected?.businessId))}
          businessesList={activeBusinesses as AppBusiness[]}
          {...entryAttachmentsApiProps}
        />
      )}
      <DuplicateSalesDialog
        lang={lang}
        draft={pendingDuplicateSummary?.payload || null}
        previousEntries={pendingDuplicateSummary?.previousEntries || []}
        businessesList={activeBusinesses as AppBusiness[]}
        onCancel={() => setPendingDuplicateSummary(null)}
        onConfirm={confirmDuplicateSummary}
      />
      <VoidOperationDialog
        lang={lang}
        item={voidTarget}
        onCancel={() => setVoidTarget(null)}
        onConfirm={confirmVoidOperation}
      />
      <RestoreOperationDialog
        lang={lang}
        item={restoreTarget}
        onCancel={() => setRestoreTarget(null)}
        onConfirm={confirmRestoreOperation}
      />
      <SavedOutflowShareDialog
        lang={lang}
        item={savedOutflowShareTarget}
        businessesList={activeBusinesses as AppBusiness[]}
        onClose={() => setSavedOutflowShareTarget(null)}
      />
      <NotebookShareModal
        lang={lang}
        snapshot={shareSnapshot as NotebookShareSnapshot | null}
        onClose={() => setShareSnapshot(null)}
        businessesList={reportingBusinesses as AppBusiness[]}
        operationalEntries={operationalEntries}
        archivedBusinessIds={archivedBusinessIds}
        notebookExportApiEnabled={phase9ApiEnabled && entriesApiEnabled}
        notebookExportAuth={runtimeApiAuth}
        allowedFormats={(shareSnapshot as NotebookShareSnapshot | null)?.screen === "register" ? ["excel", "pdf"] : ["image", "pdf", "excel"]}
      />
      {!ownerEditCloseout && (
        <OwnerCloseoutModals
          lang={lang}
          ownerManageCloseout={ownerManageCloseout}
          ownerDisplayName={ownerDisplayName}
          ownerNotebookTheme={notebookTheme}
          resolveSalesChannels={resolveSalesChannelsForEdit}
          channelLabel={registerChannelLabel}
          onCloseoutUpdated={(closeout) => handleOwnerCloseoutUpdated(closeout as AppCloseoutRecord)}
          onCloseoutDeleted={(closeout) => handleOwnerCloseoutDeleted(closeout as AppCloseoutRecord)}
          onClose={() => setOwnerManageCloseout(null)}
          onOwnerEditCloseout={handleEditOwnerCloseoutFromManage}
          {...ownerCloseoutAttachmentsApiProps}
        />
      )}
      <OwnerCloseoutEditFlow
        lang={lang}
        editCloseout={ownerEditCloseout}
        ownerActor={ownerCloseoutActor}
        ownerNotebookTheme={notebookTheme}
        resolveSalesChannels={resolveSalesChannelsForEdit}
        channelLabel={registerChannelLabel}
        onCloseoutUpdated={(closeout) => handleOwnerCloseoutUpdated(closeout as AppCloseoutRecord)}
        onClose={() => setOwnerEditCloseout(null)}
      />
      <HelpCenterSheet lang={lang} open={helpOpen} onClose={() => setHelpOpen(false)} />
    </>
  );
}
