"use client";

import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import NotebookScrollSurface from "@/features/daily-closeouts/NotebookScrollSurface";
import { notebookCardBackground } from "@/features/daily-closeouts/notebook-themes";
import { useOwnerNotebookNotes } from "@/features/owner-notebook/client/use-owner-notebook-notes";
import { text } from "./taqfeelah-app-demo-data";
import { NotebookHeading } from "./taqfeelah-app-notebook";
import { OwnerNotebookShareModal } from "./taqfeelah-app-owner-notebook-share-modal";
import {
  NoteCard,
  NoteComposerPanel,
  NotebookEmptyState,
  NotebookViewTabs,
  resolveNotebookViewItem,
} from "./owner-notebook-ui-primitives";
import type { OwnerNotebookScreenProps } from "./taqfeelah-app-types";
import type { OwnerNotebookFilter, OwnerNotebookNote, OwnerNotebookNoteInput } from "@/features/owner-notebook/owner-notebook-types";

export function OwnerNotebookScreen({
  lang,
  notebookTheme = "yellow",
  organizationId = "",
  userId = "",
  apiEnabled = false,
}: OwnerNotebookScreenProps) {
  const {
    hydrated,
    loadError,
    notes,
    visibleNotes,
    hasMore,
    loadingMore,
    loadMore,
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
  const [shareNote, setShareNote] = useState<OwnerNotebookNote | null>(null);
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

  const handleAdd = (payload: OwnerNotebookNoteInput) => {
    void addNote(payload).then((created) => {
      if (created) setComposerOpen(false);
    });
  };

  const handleTabChange = (nextFilter: OwnerNotebookFilter) => {
    setFilter(nextFilter);
    setEditingId(null);
  };

  const activeView = useMemo(
    () => resolveNotebookViewItem(lang, tabCounts, filter),
    [lang, tabCounts, filter],
  );

  const showGlobalEmpty = hydrated && filter === "active" && notes.length === 0 && !composerOpen;
  const showError = hydrated && Boolean(loadError);
  const showTabEmpty = hydrated && visibleNotes.length === 0 && !showGlobalEmpty && !showError;

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

          <article className="mb-0">
            <NotebookViewTabs
              lang={lang}
              active={filter}
              tabCounts={tabCounts}
              onChange={handleTabChange}
            />

            <div
              className={`overflow-hidden rounded-b-[16px] border border-[#E8E1D4]/90 border-t-0 px-2.5 py-2.5 shadow-[0_2px_4px_rgba(17,42,70,0.04),0_8px_20px_rgba(17,42,70,0.06)] ${activeView.contentSurfaceClass} ${activeView.contentAccentClass}`}
              role="tabpanel"
            >
              {!hydrated ? (
                <div className="px-2 py-8 text-center text-taq-meta font-bold text-[#827762]">
                  {text(lang, "loading")}
                </div>
              ) : showError ? (
                <div className="px-3 py-8 text-center">
                  <p className="text-taq-meta font-black text-[#B44747]">
                    {lang === "ar" ? "تعذر تحميل الدفتري من الخادم." : "Could not load notebook from the server."}
                  </p>
                  <p className="mt-1 text-[10px] font-bold text-[#827762]">
                    {lang === "ar" ? "أعد المحاولة بعد التأكد من الاتصال." : "Check the connection and try again."}
                  </p>
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
                      onShare={(note) => setShareNote(note as OwnerNotebookNote)}
                    />
                  ))}
                  {hasMore ? (
                    <button
                      type="button"
                      disabled={loadingMore}
                      onClick={() => { void loadMore(); }}
                      className="w-full rounded-2xl bg-white py-3 text-taq-meta font-black text-[#112A46] ring-1 ring-black/[0.06] disabled:opacity-60"
                    >
                      {loadingMore
                        ? (lang === "ar" ? "جارٍ التحميل..." : "Loading...")
                        : (lang === "ar" ? "تحميل المزيد" : "Load more")}
                    </button>
                  ) : null}
                </div>
              )}
            </div>
          </article>
        </div>
      </motion.section>
      <OwnerNotebookShareModal lang={lang} note={shareNote} onClose={() => setShareNote(null)} />
    </NotebookScrollSurface>
  );
}
