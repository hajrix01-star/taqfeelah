"use client";

import React, { useEffect, useState } from "react";
import { BookMarked, Check, Pencil, Plus, Send, Trash2 } from "lucide-react";
import { notebookCardBackground, notebookThemes } from "@/features/daily-closeouts/notebook-themes";
import { text } from "./prototype-runtime-demo-data";
import { ThemePicker } from "./prototype-runtime-notebook";
import { Badge } from "./prototype-runtime-shell-ui";

export function formatNoteTime(iso, lang) {
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

export const OWNER_NOTEBOOK_VIEW_TABS = [
  { id: "all", label: "ownerNotebookAll" },
  { id: "tasks", label: "ownerNotebookTasks" },
  { id: "notes", label: "ownerNotebookNotes" },
  { id: "done", label: "ownerNotebookDone" },
];

export function NotebookViewTabs({ lang, active, tabs, onChange, tabCounts = {} }) {
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

export function NoteComposerPanel({
  lang,
  notebookTheme,
  onAdd,
  onCancel,
}) {
  const [draft, setDraft] = useState("");
  const [kind, setKind] = useState("note");
  const [color, setColor] = useState(notebookTheme);

  useEffect(() => {
    setColor(notebookTheme);
  }, [notebookTheme]);

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
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={handleKeyDown}
        rows={3}
        placeholder={text(lang, "ownerNotebookPlaceholder")}
        className="w-full resize-none bg-transparent text-taq-body-sm font-bold leading-6 text-[#112A46] outline-none placeholder:font-bold placeholder:text-[#A99D87]"
      />
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <KindSegment lang={lang} value={kind} onChange={setKind} />
        <span className="hidden text-[10px] font-bold text-[#A99D87] sm:inline">
          {lang === "ar" ? "⌘/Ctrl + Enter للحفظ" : "⌘/Ctrl + Enter to save"}
        </span>
      </div>
      <div className="mt-3">
        <ThemePicker lang={lang} theme={color} onChange={setColor} />
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
        <ThemePicker lang={lang} theme={color} onChange={setColor} />
      </div>
      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto_auto]">
        <button
          type="button"
          onClick={() => onSave({ text: draft, kind, color })}
          disabled={!draft.trim()}
          className="rounded-2xl bg-[#112A46] px-4 py-2.5 text-taq-meta font-black text-white disabled:opacity-45"
        >
          {text(lang, "save")}
        </button>
        <div className="grid grid-cols-2 gap-2 sm:contents">
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
    </div>
  );
}

export function NoteCard({
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

export function NotebookEmptyState({ lang, onAddNew }) {
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
