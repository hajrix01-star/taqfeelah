"use client";

import React, { useEffect, useRef, useState } from "react";
import { BookMarked, Check, Pencil, Plus, Send, Trash2, X } from "lucide-react";
import { NOTEBOOK_THEME_IDS, notebookCardBackground, notebookThemes } from "@/features/daily-closeouts/notebook-themes";
import {
  createChecklistItem,
  hasOwnerNotebookTaskContent,
  normalizeChecklist,
} from "@/features/owner-notebook/owner-notebook-checklist";
import { text } from "./prototype-runtime-demo-data";
import { Badge } from "./prototype-runtime-shell-ui";

export function formatNoteTime(iso, lang) {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat(lang === "ar" ? "ar-SA-u-nu-latn" : "en-GB", {
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
  { id: "active", label: "ownerNotebookActive" },
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

function KindSegment({ lang, value, onChange, compact = false }) {
  const options = [
    { id: "note", label: "ownerNotebookNote" },
    { id: "task", label: "ownerNotebookTask" },
  ];
  return (
    <div className={`inline-flex shrink-0 rounded-full bg-[#F0ECE2]/80 ring-1 ring-[#E8E1D4] ${compact ? "p-0.5" : "p-1"}`}>
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => onChange(option.id)}
          className={`rounded-full font-black transition-colors duration-150 ${
            compact ? "px-2.5 py-1 text-[10px]" : "px-3 py-1.5 text-taq-meta"
          } ${value === option.id ? "bg-white text-[#112A46] shadow-sm" : "text-[#827762]"}`}
        >
          {text(lang, option.label)}
        </button>
      ))}
    </div>
  );
}

function useAutoGrowTextarea(value, { minHeight = 72, maxHeight = 240 } = {}) {
  const ref = useRef(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    element.style.height = "auto";
    const nextHeight = Math.min(Math.max(element.scrollHeight, minHeight), maxHeight);
    element.style.height = `${nextHeight}px`;
  }, [value, minHeight, maxHeight]);

  return ref;
}

function NoteTextFieldWithColorPicker({
  lang,
  value,
  onChange,
  color,
  onColorChange,
  onKeyDown,
  placeholder,
  textareaRef,
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!pickerOpen) return;
    const handlePointerDown = (event) => {
      if (containerRef.current?.contains(event.target)) return;
      setPickerOpen(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [pickerOpen]);

  const handleSelect = (nextColor) => {
    onColorChange(nextColor);
    setPickerOpen(false);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Escape" && pickerOpen) {
      event.preventDefault();
      event.stopPropagation();
      setPickerOpen(false);
      return;
    }
    onKeyDown?.(event);
  };

  return (
    <div ref={containerRef} className="relative min-h-[72px]">
      <button
        type="button"
        aria-expanded={pickerOpen}
        aria-label={text(lang, "notebookAppearance")}
        title={text(lang, color)}
        onClick={() => setPickerOpen((open) => !open)}
        className={`absolute top-2 left-2 z-10 h-7 w-7 rounded-full border border-[#D9D1C1] shadow-sm ring-2 ring-white/80 transition-transform active:scale-95 ${
          pickerOpen ? "pointer-events-none opacity-0" : ""
        }`}
        style={{ backgroundColor: notebookThemes[color]?.paper }}
      />
      {pickerOpen ? (
        <div
          role="listbox"
          aria-label={text(lang, "notebookAppearance")}
          className="absolute inset-0 z-20 flex min-h-[72px] items-center gap-1.5 overflow-x-auto rounded-lg bg-white/94 px-2 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] ring-1 ring-[#E8E1D4]/90 backdrop-blur-[2px] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {NOTEBOOK_THEME_IDS.map((id) => {
            const active = color === id;
            const label = text(lang, id);
            return (
              <button
                key={id}
                type="button"
                role="option"
                aria-selected={active}
                aria-label={label}
                title={label}
                onClick={() => handleSelect(id)}
                className={`relative shrink-0 rounded-full border transition-transform active:scale-95 ${
                  active ? "border-[#112A46] ring-2 ring-[#112A46]/15" : "border-[#D9D1C1]"
                }`}
              >
                <span
                  className="block h-7 w-7 rounded-full"
                  style={{ backgroundColor: notebookThemes[id]?.paper }}
                />
                {active ? <Check className="absolute inset-0 m-auto h-3.5 w-3.5 text-[#112A46]" strokeWidth={3} /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={onChange}
        onKeyDown={handleKeyDown}
        rows={2}
        placeholder={placeholder}
        dir={lang === "ar" ? "rtl" : "ltr"}
        className="min-h-[72px] w-full resize-none overflow-hidden bg-transparent py-2 pl-11 pr-3 text-taq-body-sm font-bold leading-6 text-[#112A46] outline-none placeholder:font-bold placeholder:text-[#A99D87]"
      />
    </div>
  );
}

function TaskChecklistEditor({
  lang,
  items,
  onChange,
  onEnterOnLast,
}) {
  const updateItemText = (itemId, nextText) => {
    onChange(items.map((item) => (item.id === itemId ? { ...item, text: nextText } : item)));
  };

  const removeItem = (itemId) => {
    const next = items.filter((item) => item.id !== itemId);
    onChange(next.length ? next : [createChecklistItem("")]);
  };

  const handleKeyDown = (event, itemId, index) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (index === items.length - 1) {
        onEnterOnLast?.();
      }
    }
  };

  return (
    <div className="space-y-1.5">
      {items.map((item, index) => (
        <div key={item.id} className="flex items-center gap-1.5">
          <span className="mt-0.5 h-4 w-4 shrink-0 rounded border border-[#D9D0C0] bg-white" />
          <input
            type="text"
            value={item.text}
            onChange={(event) => updateItemText(item.id, event.target.value)}
            onKeyDown={(event) => handleKeyDown(event, item.id, index)}
            placeholder={text(lang, "ownerNotebookItemPlaceholder")}
            dir={lang === "ar" ? "rtl" : "ltr"}
            className="min-w-0 flex-1 bg-transparent py-1 text-taq-body-sm font-bold text-[#112A46] outline-none placeholder:font-bold placeholder:text-[#A99D87]"
          />
          {items.length > 1 ? (
            <button
              type="button"
              onClick={() => removeItem(item.id)}
              aria-label={text(lang, "delete")}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[#B44747]/80 hover:bg-[#FFF1EE]"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
      ))}
      <button
        type="button"
        onClick={onEnterOnLast}
        className="inline-flex items-center gap-1 rounded-lg px-1 py-1 text-[10px] font-black text-[#827762] hover:text-[#112A46]"
      >
        <Plus className="h-3 w-3" />
        {text(lang, "ownerNotebookAddItem")}
      </button>
    </div>
  );
}

function TaskChecklistDisplay({ lang, note, onToggleItem }) {
  if (!note.checklist?.length) return null;
  return (
    <ul className="mt-2 space-y-1.5">
      {note.checklist.map((item) => (
        <li key={item.id} className="flex items-start gap-2">
          <button
            type="button"
            aria-label={text(lang, item.done ? "ownerNotebookDone" : "ownerNotebookTask")}
            aria-pressed={item.done}
            onClick={() => onToggleItem?.(item.id)}
            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md ring-1 transition-colors duration-150 ${
              item.done ? "bg-[#257844] text-white ring-[#257844]" : "bg-white text-transparent ring-[#D9D0C0] hover:ring-[#257844]/40"
            }`}
          >
            <Check className="h-3 w-3" />
          </button>
          <span className={`text-taq-body-sm font-bold leading-6 ${
            item.done ? "text-[#A99D87] line-through" : "text-[#112A46]"
          }`}
          >
            {item.text}
          </span>
        </li>
      ))}
    </ul>
  );
}

function buildComposerChecklist(items) {
  return normalizeChecklist(
    items
      .map((item) => ({ ...item, text: item.text.trim() }))
      .filter((item) => item.text),
  );
}

function canSubmitComposer({ kind, draft, checklistItems }) {
  if (kind === "note") return draft.trim().length > 0;
  return hasOwnerNotebookTaskContent("task", draft, buildComposerChecklist(checklistItems));
}

export function NoteComposerPanel({
  lang,
  notebookTheme,
  onAdd,
  onCancel,
}) {
  const [draft, setDraft] = useState("");
  const [kind, setKind] = useState("task");
  const [color, setColor] = useState(notebookTheme);
  const [checklistItems, setChecklistItems] = useState(() => [createChecklistItem("")]);
  const textareaRef = useAutoGrowTextarea(draft, { minHeight: kind === "task" ? 48 : 72 });

  useEffect(() => {
    setColor(notebookTheme);
  }, [notebookTheme]);

  const addChecklistRow = () => {
    setChecklistItems((current) => [...current, createChecklistItem("")]);
  };

  const submit = () => {
    const checklist = kind === "task" ? buildComposerChecklist(checklistItems) : [];
    const created = onAdd({
      text: draft.trim(),
      kind,
      color,
      ...(checklist.length ? { checklist } : {}),
    });
    if (!created) return;
    setDraft("");
    setKind("task");
    setChecklistItems([createChecklistItem("")]);
    setColor(notebookTheme);
    onCancel?.();
  };

  const handleKeyDown = (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      if (canSubmitComposer({ kind, draft, checklistItems })) submit();
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

  const placeholder = kind === "task"
    ? text(lang, "ownerNotebookTaskTitle")
    : text(lang, "ownerNotebookPlaceholder");

  return (
    <article
      className="overflow-hidden rounded-[18px] border border-[#E8E1D4] px-3 py-2.5 shadow-[0_6px_14px_rgba(17,42,70,0.05)]"
      style={cardStyle}
    >
      <NoteTextFieldWithColorPicker
        lang={lang}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        color={color}
        onColorChange={setColor}
        textareaRef={textareaRef}
      />
      {kind === "task" ? (
        <div className="mt-2 border-t border-[#E8E1D4]/80 pt-2">
          <TaskChecklistEditor
            lang={lang}
            items={checklistItems}
            onChange={setChecklistItems}
            onEnterOnLast={addChecklistRow}
          />
        </div>
      ) : null}
      <div className={`mt-2 flex ${lang === "ar" ? "justify-end" : "justify-start"}`}>
        <KindSegment lang={lang} value={kind} onChange={setKind} compact />
      </div>
      <div className="mt-2.5 flex items-center gap-2">
        <button
          type="button"
          onClick={submit}
          disabled={!canSubmitComposer({ kind, draft, checklistItems })}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#112A46] px-3 py-2 text-[11px] font-black text-white disabled:opacity-45"
        >
          <Plus className="h-3.5 w-3.5" />
          {text(lang, "ownerNotebookAdd")}
        </button>
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="shrink-0 rounded-xl bg-white px-3 py-2 text-[11px] font-black text-[#827762] ring-1 ring-[#E8E1D4]"
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
  const [checklistItems, setChecklistItems] = useState(
    () => (note.checklist?.length ? note.checklist : [createChecklistItem("")]),
  );
  const textareaRef = useAutoGrowTextarea(draft, { minHeight: kind === "task" ? 48 : 72 });

  useEffect(() => {
    setDraft(note.text);
    setKind(note.kind);
    setColor(note.color);
    setChecklistItems(note.checklist?.length ? note.checklist : [createChecklistItem("")]);
  }, [note.text, note.kind, note.color, note.checklist]);

  const addChecklistRow = () => {
    setChecklistItems((current) => [...current, createChecklistItem("")]);
  };

  const cardStyle = {
    backgroundColor: notebookCardBackground(color, "inset"),
  };

  const checklist = kind === "task" ? buildComposerChecklist(checklistItems) : [];
  const canSave = canSubmitComposer({ kind, draft, checklistItems: kind === "task" ? checklistItems : [] });

  return (
    <div className="border-t border-[#E8E1D4] px-3 py-2.5" style={cardStyle}>
      <NoteTextFieldWithColorPicker
        lang={lang}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        color={color}
        onColorChange={setColor}
        textareaRef={textareaRef}
        placeholder={kind === "task" ? text(lang, "ownerNotebookTaskTitle") : text(lang, "ownerNotebookPlaceholder")}
      />
      {kind === "task" ? (
        <div className="mt-2 border-t border-[#E8E1D4]/80 pt-2">
          <TaskChecklistEditor
            lang={lang}
            items={checklistItems}
            onChange={setChecklistItems}
            onEnterOnLast={addChecklistRow}
          />
        </div>
      ) : null}
      <div className={`mt-2 flex ${lang === "ar" ? "justify-end" : "justify-start"}`}>
        <KindSegment lang={lang} value={kind} onChange={setKind} compact />
      </div>
      <div className="mt-2.5 flex items-center gap-2">
        <button
          type="button"
          onClick={() => onSave({
            text: draft.trim(),
            kind,
            color,
            ...(kind === "task" ? { checklist } : { checklist: [] }),
          })}
          disabled={!canSave}
          className="flex-1 rounded-xl bg-[#112A46] px-3 py-2 text-[11px] font-black text-white disabled:opacity-45"
        >
          {text(lang, "save")}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="shrink-0 rounded-xl bg-white px-3 py-2 text-[11px] font-black text-[#827762] ring-1 ring-[#E8E1D4]"
        >
          {text(lang, "cancel")}
        </button>
        <button
          type="button"
          onClick={onDelete}
          aria-label={text(lang, "delete")}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#FFF1EE] text-[#B44747] ring-1 ring-[#B44747]/10"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
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
  onToggleChecklistItem,
  onShare,
}) {
  const hasChecklist = note.kind === "task" && note.checklist?.length > 0;
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
        note.done && !hasChecklist ? "opacity-90" : ""
      }`}
      style={cardStyle}
    >
      <div className="flex items-start gap-2.5 px-3.5 py-3">
        {note.kind === "task" && !hasChecklist ? (
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
          {note.text ? (
            <p className={`whitespace-pre-wrap text-taq-body-sm font-bold leading-6 ${
              note.done && !hasChecklist ? "text-[#A99D87] line-through" : "text-[#112A46]"
            }`}
            >
              {note.text}
            </p>
          ) : null}
          <TaskChecklistDisplay
            lang={lang}
            note={note}
            onToggleItem={onToggleChecklistItem}
          />
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
