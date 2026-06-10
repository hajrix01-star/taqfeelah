"use client";

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
        item={selected}
        onClose={() => setSelected(null)}
        onVoid={requestVoidOperation}
        onRestore={requestRestoreOperation}
        canVoid={Boolean(selected) && !archivedBusinessIds.includes(selected?.businessId)}
        canRestore={Boolean(selected) && !archivedBusinessIds.includes(selected?.businessId)}
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
