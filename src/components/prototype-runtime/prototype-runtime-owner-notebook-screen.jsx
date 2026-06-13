"use client";

import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import NotebookScrollSurface from "@/features/daily-closeouts/NotebookScrollSurface";
import { notebookCardBackground } from "@/features/daily-closeouts/notebook-themes";
import { useOwnerNotebookNotes } from "@/features/owner-notebook/client/use-owner-notebook-notes";
import { text } from "./prototype-runtime-demo-data";
import { NotebookHeading } from "./prototype-runtime-notebook";
import { OwnerNotebookShareModal } from "./prototype-runtime-owner-notebook-share-modal";
import {
  NoteCard,
  NoteComposerPanel,
  NotebookEmptyState,
  NotebookViewTabs,
  OWNER_NOTEBOOK_VIEW_TABS,
} from "./owner-notebook-ui-primitives";

export function OwnerNotebookScreen({
  lang,
  notebookTheme = "yellow",
  organizationId = "",
  userId = "",
  apiEnabled = false,
}) {
  const {
    hydrated,
    notes,
    visibleNotes,
    filter,
    setFilter,
    editingId,
    setEditingId,
    addNote,
    saveNote,
    removeNote,
    toggleDone,
    toggleChecklistItem,
  } = useOwnerNotebookNotes({ organizationId, userId, apiEnabled });

  const [composerOpen, setComposerOpen] = useState(false);
  const [shareNote, setShareNote] = useState(null);
  const paperColor = useMemo(() => notebookCardBackground(notebookTheme), [notebookTheme]);
  const cardStyle = useMemo(
    () => ({ backgroundColor: paperColor }),
    [paperColor],
  );

  const tabCounts = useMemo(() => {
    const tasks = notes.filter((note) => note.kind === "task");
    return {
      active: notes.filter((note) => note.kind === "note" || !note.done).length,
      tasks: tasks.filter((task) => !task.done).length,
      notes: notes.filter((note) => note.kind === "note").length,
      done: tasks.filter((task) => task.done).length,
    };
  }, [notes]);

  const openComposer = () => {
    setEditingId(null);
    setComposerOpen(true);
  };

  const handleAdd = (payload) => {
    const created = addNote(payload);
    if (created) setComposerOpen(false);
    return created;
  };

  const handleTabChange = (nextFilter) => {
    setFilter(nextFilter);
    setEditingId(null);
  };

  const showGlobalEmpty = hydrated && filter === "active" && notes.length === 0 && !composerOpen;
  const showTabEmpty = hydrated && visibleNotes.length === 0 && !showGlobalEmpty;

  return (
    <NotebookScrollSurface theme={notebookTheme} lang={lang}>
      <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="taq-owner-page taq-notebook-body pb-28 pt-1">
        <NotebookHeading lang={lang} label={text(lang, "ownerNotebook")} />

        <div className="space-y-3">
          {composerOpen ? (
            <NoteComposerPanel
              lang={lang}
              notebookTheme={notebookTheme}
              onAdd={handleAdd}
              onCancel={() => setComposerOpen(false)}
            />
          ) : (
            <button
              type="button"
              onClick={openComposer}
              className="flex w-full items-center gap-3 rounded-[22px] border border-[#E8E1D4] px-4 py-3.5 text-start shadow-[0_8px_18px_rgba(17,42,70,0.05)] ring-1 ring-transparent transition-[box-shadow,background-color] duration-150 hover:ring-[#112A46]/10"
              style={cardStyle}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#112A46] text-white">
                <Plus className="h-4 w-4" />
              </span>
              <span>
                <span className="block text-taq-meta font-black text-[#112A46]">{text(lang, "ownerNotebookNew")}</span>
                <span className="mt-0.5 block text-[10px] font-bold text-[#827762]">{text(lang, "ownerNotebookPlaceholder")}</span>
              </span>
            </button>
          )}

          <div className="overflow-hidden rounded-[18px] border border-[#E8E1D4]/90 bg-white shadow-[0_2px_4px_rgba(17,42,70,0.04),0_8px_20px_rgba(17,42,70,0.06)]">
            <NotebookViewTabs
              lang={lang}
              active={filter}
              tabs={OWNER_NOTEBOOK_VIEW_TABS}
              tabCounts={tabCounts}
              onChange={handleTabChange}
            />

            <div className="px-2.5 py-2.5" style={cardStyle} role="tabpanel">
              {!hydrated ? (
                <div className="px-2 py-8 text-center text-taq-meta font-bold text-[#827762]">
                  {text(lang, "loading")}
                </div>
              ) : showGlobalEmpty ? (
                <NotebookEmptyState lang={lang} onAddNew={openComposer} />
              ) : showTabEmpty ? (
                <div className="px-2 py-10 text-center text-taq-meta font-bold text-[#827762]">
                  {text(lang, "ownerNotebookEmpty")}
                </div>
              ) : (
                <div className="space-y-2.5">
                  {visibleNotes.map((note) => (
                    <NoteCard
                      key={note.id}
                      lang={lang}
                      note={note}
                      editing={editingId === note.id}
                      onEdit={() => {
                        setComposerOpen(false);
                        setEditingId(note.id);
                      }}
                      onCancel={() => setEditingId(null)}
                      onSave={(patch) => {
                        saveNote(note.id, patch);
                        setEditingId(null);
                      }}
                      onDelete={() => removeNote(note.id)}
                      onToggleDone={() => toggleDone(note.id)}
                      onToggleChecklistItem={(itemId) => toggleChecklistItem(note.id, itemId)}
                      onShare={setShareNote}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.section>
      <OwnerNotebookShareModal lang={lang} note={shareNote} onClose={() => setShareNote(null)} />
    </NotebookScrollSurface>
  );
}
