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
}) {
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
      closeouts,
      resolveCloseoutForOperationalEntry,
    ),
    [closeouts, resolvedSelected],
  );

  const handleEditOwnerCloseoutFromEntry = useCallback(async (entry) => {
    let closeout = resolveCloseoutForOperationalEntry(entry, closeouts);
    if (!closeout && typeof reloadCloseoutsFromApi === "function") {
      try {
        const remoteCloseouts = await reloadCloseoutsFromApi();
        closeout = resolveCloseoutForOperationalEntry(entry, remoteCloseouts);
      } catch {
        // fall through to alert below
      }
    }
    if (!closeout) {
      window.alert(lang === "ar"
        ? "تعذر العثور على التقفيلة المرتبطة بهذه العملية."
        : "Could not find the closeout linked to this entry.");
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
        lang={lang}
        item={resolvedSelected}
        onClose={() => setSelected(null)}
        onVoid={requestVoidOperation}
        onRestore={requestRestoreOperation}
        onEditOwnerCloseout={!employee ? handleEditOwnerCloseoutFromEntry : undefined}
        ownerEditSource={selectedOwnerEditSource}
        canVoid={Boolean(resolvedSelected) && !archivedBusinessIds.includes(resolvedSelected?.businessId)}
        canRestore={Boolean(resolvedSelected) && !archivedBusinessIds.includes(resolvedSelected?.businessId)}
        {...entryAttachmentsApiProps}
      />
      <DuplicateSalesDialog
        lang={lang}
        draft={pendingDuplicateSummary?.payload || null}
        previousEntries={pendingDuplicateSummary?.previousEntries || []}
        businessesList={activeBusinesses}
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
        businessesList={activeBusinesses}
        onClose={() => setSavedOutflowShareTarget(null)}
      />
      <NotebookShareModal
        lang={lang}
        snapshot={shareSnapshot}
        onClose={() => setShareSnapshot(null)}
        businessesList={reportingBusinesses}
        operationalEntries={operationalEntries}
        archivedBusinessIds={archivedBusinessIds}
        notebookExportApiEnabled={phase9ApiEnabled && entriesApiEnabled}
        notebookExportAuth={runtimeApiAuth}
        allowedFormats={shareSnapshot?.screen === "register" ? ["excel", "pdf"] : ["image", "pdf", "excel"]}
      />
      <OwnerCloseoutModals
        lang={lang}
        ownerManageCloseout={ownerManageCloseout}
        ownerDisplayName={ownerDisplayName}
        ownerNotebookTheme={notebookTheme}
        resolveSalesChannels={resolveStoreSalesChannels}
        channelLabel={(channel) => channel.displayName || channelName(channel, lang)}
        onCloseoutUpdated={handleOwnerCloseoutUpdated}
        onCloseoutDeleted={handleOwnerCloseoutDeleted}
        onClose={() => setOwnerManageCloseout(null)}
        onOwnerEditCloseout={(closeout) => {
          setOwnerManageCloseout(null);
          setOwnerEditCloseout(closeout);
        }}
        {...ownerCloseoutAttachmentsApiProps}
      />
      <OwnerCloseoutEditFlow
        lang={lang}
        editCloseout={ownerEditCloseout}
        ownerActor={ownerCloseoutActor}
        ownerNotebookTheme={notebookTheme}
        resolveSalesChannels={resolveStoreSalesChannels}
        channelLabel={(channel) => channel.displayName || channelName(channel, lang)}
        onCloseoutUpdated={handleOwnerCloseoutUpdated}
        onClose={() => setOwnerEditCloseout(null)}
      />
      <HelpCenterSheet lang={lang} open={helpOpen} onClose={() => setHelpOpen(false)} />
    </>
  );
}
