"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { BookMarked, Check, Lock, Pencil, Plus, Send, Trash2 } from "lucide-react";
import NotebookScrollSurface from "@/features/daily-closeouts/NotebookScrollSurface";
import { notebookCardBackground, notebookThemes } from "@/features/daily-closeouts/notebook-themes";
import { getOwnerNotebookColorOptions } from "@/features/owner-notebook/owner-notebook-storage";
import { useOwnerNotebookNotes } from "@/features/owner-notebook/client/use-owner-notebook-notes";
import { text } from "./prototype-runtime-demo-data";
import { NotebookHeading } from "./prototype-runtime-notebook";
import { Badge } from "./prototype-runtime-shell-ui";
import { OwnerNotebookShareModal } from "./prototype-runtime-owner-notebook-share-modal";

function formatNoteTime(iso, lang) {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat(lang === "ar" ? "ar-SA" : "en-GB", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

function NotebookViewTabs({ lang, active, tabs, onChange, tabCounts = {} }) {
  return (
    <div className="border-b border-[#ECE6DA] bg-white px-2.5 py-2">
      <div
        role="tablist"
        aria-label={text(lang, "ownerNotebook")}
        className="grid grid-cols-4 gap-0.5 rounded-[11px] bg-[#EFEBE2] p-0.5"
      >
        {tabs.map((tab) => {
          const isActive = active === tab.id;
          const count = tabCounts[tab.id] ?? 0;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(tab.id)}
              className={`flex min-w-0 flex-col items-center justify-center gap-0.5 rounded-[9px] px-1 py-1.5 transition-all duration-200 ${
                isActive
                  ? "bg-white text-[#112A46] shadow-[0_1px_5px_rgba(17,42,70,0.08)]"
                  : "text-[#8A8070] hover:text-[#112A46]"
              }`}
            >
              <span className="w-full truncate text-center text-[10px] font-black leading-tight">
                {text(lang, tab.label)}
              </span>
              <span
                className={`rounded-md px-1.5 py-px text-[9px] font-bold tabular-nums leading-none ${
                  isActive ? "bg-[#112A46] text-white" : "bg-[#112A46]/[0.07] text-[#827762]"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function KindSegment({ lang, value, onChange }) {
  const options = [
    { id: "note", label: "ownerNotebookNote" },
    { id: "task", label: "ownerNotebookTask" },
  ];
  return (
    <div className="inline-flex rounded-full bg-[#F0ECE2]/80 p-1 ring-1 ring-[#E8E1D4]">
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => onChange(option.id)}
          className={`rounded-full px-3 py-1.5 text-taq-meta font-black transition-colors duration-150 ${
            value === option.id ? "bg-white text-[#112A46] shadow-sm" : "text-[#827762]"
          }`}
        >
          {text(lang, option.label)}
        </button>
      ))}
    </div>
  );
}

function NotebookColorPicker({ lang, value, onChange }) {
  const options = useMemo(() => getOwnerNotebookColorOptions(), []);
  return (
    <div className="flex gap-2 overflow-x-auto pb-0.5">
      {options.map((option) => {
        const active = value === option.id;
        return (
          <button
            key={option.id}
            type="button"
            title={text(lang, option.id)}
            aria-label={text(lang, option.id)}
            onClick={() => onChange(option.id)}
            className={`flex shrink-0 flex-col items-center gap-1 ${active ? "opacity-100" : "opacity-80"}`}
          >
            <span
              className={`relative flex h-7 w-7 items-center justify-center rounded-full border transition-colors duration-150 ${
                active ? "border-[#112A46] ring-2 ring-[#112A46]/15" : "border-[#D9D1C1]"
              }`}
              style={{ backgroundColor: option.paper, boxShadow: notebookThemes[option.id]?.shadow || "none" }}
            >
              {active ? <Check className="h-3.5 w-3.5 text-[#112A46]" strokeWidth={3} /> : null}
            </span>
            <span className={`max-w-[52px] truncate text-center text-[10px] font-bold leading-3 ${active ? "text-[#112A46]" : "text-[#827762]"}`}>
              {text(lang, option.id)}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function NoteComposerPanel({
  lang,
  notebookTheme,
  onAdd,
  onCancel,
  autoFocus = false,
}) {
  const inputRef = useRef(null);
  const [draft, setDraft] = useState("");
  const [kind, setKind] = useState("note");
  const [color, setColor] = useState(notebookTheme);

  useEffect(() => {
    setColor(notebookTheme);
  }, [notebookTheme]);

  useEffect(() => {
    if (!autoFocus) return;
    inputRef.current?.focus();
  }, [autoFocus]);

  const submit = () => {
    const created = onAdd({ text: draft, kind, color });
    if (!created) return;
    setDraft("");
    setKind("note");
    setColor(notebookTheme);
    onCancel?.();
  };

  const handleKeyDown = (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      if (draft.trim()) submit();
    }
    if (event.key === "Escape") {
      event.preventDefault();
      onCancel?.();
    }
  };

  const cardStyle = {
    backgroundColor: notebookCardBackground(color),
    boxShadow: notebookThemes[color]?.shadow || undefined,
  };

  return (
    <article
      className="overflow-hidden rounded-[22px] border border-[#E8E1D4] px-3.5 py-3.5 shadow-[0_8px_18px_rgba(17,42,70,0.06)]"
      style={cardStyle}
    >
      <textarea
        ref={inputRef}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={handleKeyDown}
        rows={3}
        placeholder={text(lang, "ownerNotebookPlaceholder")}
        className="w-full resize-none bg-transparent text-taq-body-sm font-bold leading-6 text-[#112A46] outline-none placeholder:font-bold placeholder:text-[#A99D87]"
      />
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <KindSegment lang={lang} value={kind} onChange={setKind} />
        <span className="text-[10px] font-bold text-[#A99D87]">
          {lang === "ar" ? "⌘/Ctrl + Enter للحفظ" : "⌘/Ctrl + Enter to save"}
        </span>
      </div>
      <div className="mt-3">
        <NotebookColorPicker lang={lang} value={color} onChange={setColor} />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={submit}
          disabled={!draft.trim()}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#112A46] px-4 py-3 text-taq-meta font-black text-white disabled:opacity-45"
        >
          <Plus className="h-4 w-4" />
          {text(lang, "ownerNotebookAdd")}
        </button>
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-2xl bg-white px-4 py-3 text-taq-meta font-black text-[#827762] ring-1 ring-[#E8E1D4]"
          >
            {text(lang, "cancel")}
          </button>
        ) : null}
      </div>
    </article>
  );
}

function NoteEditPanel({ lang, note, onSave, onCancel, onDelete }) {
  const [draft, setDraft] = useState(note.text);
  const [kind, setKind] = useState(note.kind);
  const [color, setColor] = useState(note.color);

  useEffect(() => {
    setDraft(note.text);
    setKind(note.kind);
    setColor(note.color);
  }, [note.text, note.kind, note.color]);

  const cardStyle = {
    backgroundColor: notebookCardBackground(color, "inset"),
  };

  return (
    <div className="border-t border-[#E8E1D4] px-3.5 py-3" style={cardStyle}>
      <textarea
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        rows={4}
        className="w-full resize-none bg-transparent text-taq-body-sm font-bold leading-6 text-[#112A46] outline-none"
      />
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <KindSegment lang={lang} value={kind} onChange={setKind} />
      </div>
      <div className="mt-3">
        <NotebookColorPicker lang={lang} value={color} onChange={setColor} />
      </div>
      <div className="mt-3 grid grid-cols-[1fr_auto_auto] gap-2">
        <button
          type="button"
          onClick={() => onSave({ text: draft, kind, color })}
          disabled={!draft.trim()}
          className="rounded-2xl bg-[#112A46] px-4 py-2.5 text-taq-meta font-black text-white disabled:opacity-45"
        >
          {text(lang, "save")}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-2xl bg-white px-3 py-2.5 text-taq-meta font-black text-[#827762] ring-1 ring-[#E8E1D4]"
        >
          {text(lang, "cancel")}
        </button>
        <button
          type="button"
          onClick={onDelete}
          aria-label={text(lang, "delete")}
          className="rounded-2xl bg-[#FFF1EE] px-3 py-2.5 text-taq-meta font-black text-[#B44747] ring-1 ring-[#B44747]/10"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function NoteCard({
  lang,
  note,
  editing,
  onEdit,
  onCancel,
  onSave,
  onDelete,
  onToggleDone,
  onShare,
}) {
  const cardStyle = {
    backgroundColor: notebookCardBackground(note.color),
    boxShadow: notebookThemes[note.color]?.shadow || undefined,
  };
  const accentColor = note.kind === "task"
    ? (note.done ? "#A99D87" : "#257844")
    : (notebookThemes[note.color]?.margin || "#C28A30");

  return (
    <article
      className={`overflow-hidden rounded-[19px] border border-[#E8E1D4] shadow-[0_8px_18px_rgba(17,42,70,0.06)] transition-opacity duration-150 ${
        note.done ? "opacity-90" : ""
      }`}
      style={cardStyle}
    >
      <div className="flex items-start gap-2.5 px-3.5 py-3">
        {note.kind === "task" ? (
          <button
            type="button"
            aria-label={text(lang, note.done ? "ownerNotebookDone" : "ownerNotebookTask")}
            aria-pressed={note.done}
            onClick={onToggleDone}
            className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ring-1 transition-colors duration-150 ${
              note.done ? "bg-[#257844] text-white ring-[#257844]" : "bg-white text-transparent ring-[#D9D0C0] hover:ring-[#257844]/40"
            }`}
          >
            <Check className="h-4 w-4" />
          </button>
        ) : (
          <span className="mt-1 h-7 w-1 shrink-0 rounded-full" style={{ backgroundColor: accentColor }} />
        )}
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex items-start justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge tone={note.kind === "task" ? (note.done ? "neutral" : "success") : "navy"}>
                {note.kind === "task" ? text(lang, "ownerNotebookTask") : text(lang, "ownerNotebookNote")}
              </Badge>
              <span className="text-[10px] font-bold text-[#A99D87]">{formatNoteTime(note.updatedAt, lang)}</span>
            </div>
            {!editing ? (
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => onShare(note)}
                  aria-label={text(lang, "ownerNotebookShare")}
                  className="flex h-8 w-8 items-center justify-center rounded-xl text-[#827762] transition-colors duration-150 hover:bg-white/70 hover:text-[#112A46]"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={onEdit}
                  aria-label={text(lang, "manage")}
                  className="flex h-8 w-8 items-center justify-center rounded-xl text-[#827762] transition-colors duration-150 hover:bg-white/70 hover:text-[#112A46]"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={onDelete}
                  aria-label={text(lang, "delete")}
                  className="flex h-8 w-8 items-center justify-center rounded-xl text-[#B44747]/80 transition-colors duration-150 hover:bg-[#FFF1EE] hover:text-[#B44747]"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : null}
          </div>
          <p className={`whitespace-pre-wrap text-taq-body-sm font-bold leading-6 ${
            note.done ? "text-[#A99D87] line-through" : "text-[#112A46]"
          }`}
          >
            {note.text}
          </p>
        </div>
      </div>
      {editing ? (
        <NoteEditPanel
          lang={lang}
          note={note}
          onSave={onSave}
          onCancel={onCancel}
          onDelete={onDelete}
        />
      ) : null}
    </article>
  );
}

function NotebookEmptyState({ lang, onAddNew }) {
  return (
    <div className="px-3 py-10 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F7F5EF] text-[#806528] ring-1 ring-[#E8E1D4]">
        <BookMarked className="h-5 w-5" />
      </div>
      <p className="text-taq-body-sm font-black text-[#112A46]">{text(lang, "ownerNotebookEmpty")}</p>
      <p className="mx-auto mt-2 max-w-[240px] text-taq-meta font-bold leading-5 text-[#827762]">
        {text(lang, "ownerNotebookEmptyCta")}
      </p>
      <button
        type="button"
        onClick={onAddNew}
        className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-[#112A46] px-4 py-2.5 text-taq-meta font-black text-white"
      >
        <Plus className="h-4 w-4" />
        {text(lang, "ownerNotebookNew")}
      </button>
    </div>
  );
}

const VIEW_TABS = [
  { id: "all", label: "ownerNotebookAll" },
  { id: "tasks", label: "ownerNotebookTasks" },
  { id: "notes", label: "ownerNotebookNotes" },
  { id: "done", label: "ownerNotebookDone" },
];

export function OwnerNotebookScreen({ lang, notebookTheme = "yellow" }) {
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
  } = useOwnerNotebookNotes();

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
      all: notes.length,
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

  useEffect(() => {
    if (hydrated && notes.length === 0) setComposerOpen(true);
  }, [hydrated, notes.length]);

  const showGlobalEmpty = hydrated && filter === "all" && notes.length === 0;
  const showTabEmpty = hydrated && visibleNotes.length === 0 && !showGlobalEmpty;

  return (
    <NotebookScrollSurface theme={notebookTheme} lang={lang}>
      <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="taq-owner-page taq-notebook-body pb-28 pt-1">
        <NotebookHeading lang={lang} label={text(lang, "ownerNotebook")} />

        <div className="space-y-3">
          <div className="flex items-center justify-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F7F5EF] px-3 py-1.5 text-[10px] font-black text-[#716753] ring-1 ring-[#E8E1D4]">
              <Lock className="h-3 w-3" />
              {text(lang, "ownerNotebookPrivate")}
            </span>
          </div>

          {composerOpen ? (
            <NoteComposerPanel
              lang={lang}
              notebookTheme={notebookTheme}
              onAdd={handleAdd}
              onCancel={notes.length > 0 ? () => setComposerOpen(false) : undefined}
              autoFocus
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
              tabs={VIEW_TABS}
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
