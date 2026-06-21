"use client";

import { useCallback, useMemo } from "react";
import { useDailyCloseouts } from "@/features/daily-closeouts/DailyCloseoutsProvider";
import { resolveSelectedCloseoutOwnerEditSource } from "@/features/closeouts/client/closeout-owner-edit-display";
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
} from "./prototype-runtime-operation-dialogs";
import { BottomNav } from "./prototype-runtime-chrome";
import { HelpCenterSheet } from "./AuthGateSection";
import { NotebookShareModal } from "./prototype-runtime-notebook-share-modal";
import { OwnerCloseoutEditFlow, OwnerCloseoutModals } from "./prototype-runtime-owner-closeout-modals";
import { text } from "./prototype-runtime-demo-data";
import { alertCloseoutNotFoundForEntry } from "@/lib/ui/app-dialog/app-dialog-helpers";
import type { OperationalEntry, PrototypeBusiness, PrototypeChannel, PrototypeLang, NotebookShareSnapshot } from "./prototype-runtime-types";
import type { PrototypeRuntimeOverlayStackProps, PrototypeCloseoutRecord } from "./prototype-runtime-types";
import type { DailyCloseoutRecord } from "@/features/daily-closeouts/daily-closeouts-types";

export function PrototypeRuntimeOverlayStack({
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
}: PrototypeRuntimeOverlayStackProps) {
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

  const handleEditOwnerCloseoutFromEntry = useCallback(async (entry: OperationalEntry) => {
    let closeout = resolveCloseoutForOperationalEntry(entry, closeouts as Parameters<typeof resolveCloseoutForOperationalEntry>[1]);
    if (!closeout && typeof reloadCloseoutsFromApi === "function") {
      try {
        const remoteCloseouts = await reloadCloseoutsFromApi();
        closeout = resolveCloseoutForOperationalEntry(entry, remoteCloseouts as Parameters<typeof resolveCloseoutForOperationalEntry>[1]);
      } catch {
        // fall through to alert below
      }
    }
    if (!closeout) {
      await alertCloseoutNotFoundForEntry(lang, text);
      return;
    }
    setSelected(null);
    setOwnerEditCloseout(closeout);
  }, [closeouts, lang, reloadCloseoutsFromApi, setOwnerEditCloseout, setSelected]);

  return (
    <>
      {!(employee && employeeEntryActive) && !(!employee && ownerEntryActive) && (
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
        businessesList={activeBusinesses as PrototypeBusiness[]}
        {...entryAttachmentsApiProps}
      />
      <DuplicateSalesDialog
        lang={lang}
        draft={pendingDuplicateSummary?.payload || null}
        previousEntries={pendingDuplicateSummary?.previousEntries || []}
        businessesList={activeBusinesses as PrototypeBusiness[]}
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
        businessesList={activeBusinesses as PrototypeBusiness[]}
        onClose={() => setSavedOutflowShareTarget(null)}
      />
      <NotebookShareModal
        lang={lang}
        snapshot={shareSnapshot as NotebookShareSnapshot | null}
        onClose={() => setShareSnapshot(null)}
        businessesList={reportingBusinesses as PrototypeBusiness[]}
        operationalEntries={operationalEntries}
        archivedBusinessIds={archivedBusinessIds}
        notebookExportApiEnabled={phase9ApiEnabled && entriesApiEnabled}
        notebookExportAuth={runtimeApiAuth}
        allowedFormats={(shareSnapshot as NotebookShareSnapshot | null)?.screen === "register" ? ["excel", "pdf"] : ["image", "pdf", "excel"]}
      />
      <OwnerCloseoutModals
        lang={lang}
        ownerManageCloseout={ownerManageCloseout}
        ownerDisplayName={ownerDisplayName}
        ownerNotebookTheme={notebookTheme}
        resolveSalesChannels={(storeId) => resolveStoreSalesChannels(storeId) as PrototypeChannel[]}
        channelLabel={(channel) => String((channel as PrototypeChannel).displayName || channelName(channel as PrototypeChannel, lang))}
        onCloseoutUpdated={(closeout) => handleOwnerCloseoutUpdated(closeout as PrototypeCloseoutRecord)}
        onCloseoutDeleted={(closeout) => handleOwnerCloseoutDeleted(closeout as PrototypeCloseoutRecord)}
        onClose={() => setOwnerManageCloseout(null)}
        onOwnerEditCloseout={(closeout: DailyCloseoutRecord) => {
          setOwnerManageCloseout(null);
          setOwnerEditCloseout(closeout as PrototypeCloseoutRecord);
        }}
        {...ownerCloseoutAttachmentsApiProps}
      />
      <OwnerCloseoutEditFlow
        lang={lang}
        editCloseout={ownerEditCloseout}
        ownerActor={ownerCloseoutActor}
        ownerNotebookTheme={notebookTheme}
        resolveSalesChannels={(storeId) => resolveStoreSalesChannels(storeId) as PrototypeChannel[]}
        channelLabel={(channel) => String((channel as PrototypeChannel).displayName || channelName(channel as PrototypeChannel, lang))}
        onCloseoutUpdated={(closeout) => handleOwnerCloseoutUpdated(closeout as PrototypeCloseoutRecord)}
        onClose={() => setOwnerEditCloseout(null)}
      />
      <HelpCenterSheet lang={lang} open={helpOpen} onClose={() => setHelpOpen(false)} />
    </>
  );
}