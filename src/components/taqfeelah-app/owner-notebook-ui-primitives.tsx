"use client";

import React, { useEffect, useRef, useState } from "react";
import { BookMarked, Check, Pencil, Plus, Send, Trash2, X } from "lucide-react";
import type { NotebookThemeId } from "@/features/daily-closeouts/daily-closeouts-types";
import { NOTEBOOK_THEME_IDS, notebookCardBackground, notebookThemes } from "@/features/daily-closeouts/notebook-themes";
import {
  createChecklistItem,
  hasOwnerNotebookTaskContent,
  normalizeChecklist,
} from "@/features/owner-notebook/owner-notebook-checklist";
import { text } from "./taqfeelah-app-catalog-data";
import { Badge } from "./taqfeelah-app-shell-ui";
import type { DisplayLang, SettingsTabCounts } from "./taqfeelah-app-types";

export function formatNoteTime(iso: string | null | undefined, lang: DisplayLang) {
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

const NOTEBOOK_VIEW_ACTIVE = "bg-[rgba(17,42,70,0.07)] text-[var(--taq-color-112a46)] backdrop-blur-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]";
const NOTEBOOK_VIEW_INACTIVE = "bg-white text-[var(--taq-color-716753)]";

function buildNotebookViewTabItems(lang: DisplayLang, counts: SettingsTabCounts) {
  return [
    {
      id: "active",
      label: text(lang, "ownerNotebookActive"),
      count: counts.active ?? 0,
      activeClass: NOTEBOOK_VIEW_ACTIVE,
      inactiveClass: NOTEBOOK_VIEW_INACTIVE,
      badgeActiveClass: "bg-[var(--taq-color-112a46)] text-white",
      badgeInactiveClass: "bg-[var(--taq-color-112a46)]/[0.08] text-[var(--taq-color-827762)]",
      contentSurfaceClass: "bg-[var(--taq-color-fffbf0)]",
      contentAccentClass: "border-t-2 border-[var(--taq-color-e4b84a)]/45",
    },
    {
      id: "tasks",
      label: text(lang, "ownerNotebookTasks"),
      count: counts.tasks ?? 0,
      activeClass: NOTEBOOK_VIEW_ACTIVE,
      inactiveClass: NOTEBOOK_VIEW_INACTIVE,
      badgeActiveClass: "bg-[var(--taq-color-112a46)] text-white",
      badgeInactiveClass: "bg-[var(--taq-color-257844)]/10 text-[var(--taq-color-257844)]",
      contentSurfaceClass: "bg-[var(--taq-color-f4faf6)]",
      contentAccentClass: "border-t-2 border-[var(--taq-color-257844)]/40",
    },
    {
      id: "notes",
      label: text(lang, "ownerNotebookNotes"),
      count: counts.notes ?? 0,
      activeClass: NOTEBOOK_VIEW_ACTIVE,
      inactiveClass: NOTEBOOK_VIEW_INACTIVE,
      badgeActiveClass: "bg-[var(--taq-color-112a46)] text-white",
      badgeInactiveClass: "bg-[var(--taq-color-214b7b)]/10 text-[var(--taq-color-214b7b)]",
      contentSurfaceClass: "bg-[var(--taq-color-f5f8fc)]",
      contentAccentClass: "border-t-2 border-[var(--taq-color-214b7b)]/40",
    },
    {
      id: "done",
      label: text(lang, "ownerNotebookDone"),
      count: counts.done ?? 0,
      activeClass: NOTEBOOK_VIEW_ACTIVE,
      inactiveClass: NOTEBOOK_VIEW_INACTIVE,
      badgeActiveClass: "bg-[var(--taq-color-112a46)] text-white",
      badgeInactiveClass: "bg-[var(--taq-color-806528)]/10 text-[var(--taq-color-806528)]",
      contentSurfaceClass: "bg-[var(--taq-color-faf7f0)]",
      contentAccentClass: "border-t-2 border-[var(--taq-color-806528)]/40",
    },
  ];
}

export function resolveNotebookViewItem(lang: DisplayLang, counts: SettingsTabCounts, viewId: string) {
  const items = buildNotebookViewTabItems(lang, counts);
  return items.find((item) => item.id === viewId) || items[0];
}

export function NotebookViewTabs({ lang, active, onChange, tabCounts = {} }: { lang: DisplayLang; active: string; onChange: (value: string) => void; tabCounts?: SettingsTabCounts }) {
  const items = buildNotebookViewTabItems(lang, tabCounts);

  return (
    <div
      className="flex overflow-hidden rounded-t-[14px] bg-white ring-1 ring-inset ring-[var(--taq-color-e8e1d4)]/80 shadow-[0_-1px_0_rgba(17,42,70,0.06)]"
      role="tablist"
      aria-label={text(lang, "ownerNotebook")}
    >
      {items.map((item, index) => {
        const isActive = active === item.id;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(item.id)}
            className={`flex h-9 min-w-0 flex-1 items-center justify-center gap-1 px-1.5 text-[10px] font-black transition-all duration-200 ${
              isActive ? item.activeClass : item.inactiveClass
            } ${index > 0 ? "border-s border-[var(--taq-color-e8e1d4)]/80" : ""}`}
          >
            <span className="truncate leading-4">{item.label}</span>
            <span
              className={`shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-bold tabular-nums ${
                isActive ? item.badgeActiveClass : item.badgeInactiveClass
              }`}
            >
              {item.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function KindSegment({ lang, value, onChange, compact = false }: { lang: DisplayLang; value: string; onChange: (value: string) => void; compact?: boolean }) {
  const options = [
    { id: "note", label: "ownerNotebookNote" },
    { id: "task", label: "ownerNotebookTask" },
  ];
  return (
    <div className={`inline-flex shrink-0 rounded-full bg-[var(--taq-color-f0ece2)]/80 ring-1 ring-[var(--taq-color-e8e1d4)] ${compact ? "p-0.5" : "p-1"}`}>
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => onChange(option.id)}
          className={`rounded-full font-black transition-colors duration-150 ${
            compact ? "px-2.5 py-1 text-[10px]" : "px-3 py-1.5 text-taq-meta"
          } ${value === option.id ? "bg-white text-[var(--taq-color-112a46)] shadow-sm" : "text-[var(--taq-color-827762)]"}`}
        >
          {text(lang, option.label)}
        </button>
      ))}
    </div>
  );
}

function useAutoGrowTextarea(value: string, { minHeight = 72, maxHeight = 240 }: { minHeight?: number; maxHeight?: number } = {}) {
  const ref = useRef<HTMLTextAreaElement | null>(null);

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
}: {
  lang: DisplayLang;
  value: string;
  onChange: (value: string) => void;
  color: string;
  onColorChange: (value: string) => void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  placeholder: string;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!pickerOpen) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (containerRef.current?.contains(event.target as Node)) return;
      setPickerOpen(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [pickerOpen]);

  const handleSelect = (nextColor: string) => {
    onColorChange(nextColor);
    setPickerOpen(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
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
        className={`absolute top-2 left-2 z-10 h-7 w-7 rounded-full border border-[var(--taq-color-d9d1c1)] shadow-sm ring-2 ring-white/80 transition-transform active:scale-95 ${
          pickerOpen ? "pointer-events-none opacity-0" : ""
        }`}
        style={{ backgroundColor: notebookThemes[color as NotebookThemeId]?.paper }}
      />
      {pickerOpen ? (
        <div
          role="listbox"
          aria-label={text(lang, "notebookAppearance")}
          className="absolute inset-0 z-20 flex min-h-[72px] items-center gap-1.5 overflow-x-auto rounded-lg bg-white/94 px-2 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] ring-1 ring-[var(--taq-color-e8e1d4)]/90 backdrop-blur-[2px] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
                  active ? "border-[var(--taq-color-112a46)] ring-2 ring-[var(--taq-color-112a46)]/15" : "border-[var(--taq-color-d9d1c1)]"
                }`}
              >
                <span
                  className="block h-7 w-7 rounded-full"
                  style={{ backgroundColor: notebookThemes[id]?.paper }}
                />
                {active ? <Check className="absolute inset-0 m-auto h-3.5 w-3.5 text-[var(--taq-color-112a46)]" strokeWidth={3} /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        rows={2}
        placeholder={placeholder}
        dir={lang === "ar" ? "rtl" : "ltr"}
        className="min-h-[72px] w-full resize-none overflow-hidden bg-transparent py-2 pl-11 pr-3 text-taq-body-sm font-bold leading-6 text-[var(--taq-color-112a46)] outline-none placeholder:font-bold placeholder:text-[var(--taq-color-a99d87)]"
      />
    </div>
  );
}

function TaskChecklistEditor({
  lang,
  items,
  onChange,
  onEnterOnLast,
}: {
  lang: DisplayLang;
  items: Array<{ id: string; text: string }>;
  onChange: (items: Array<{ id: string; text: string }>) => void;
  onEnterOnLast?: () => void;
}) {
  const updateItemText = (itemId: string, nextText: string) => {
    onChange(items.map((item) => (item.id === itemId ? { ...item, text: nextText } : item)));
  };

  const removeItem = (itemId: string) => {
    const next = items.filter((item) => item.id !== itemId);
    onChange(next.length ? next : [createChecklistItem("")]);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>, itemId: string, index: number) => {
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
          <span className="mt-0.5 h-4 w-4 shrink-0 rounded border border-[var(--taq-color-d9d0c0)] bg-white" />
          <input
            type="text"
            value={item.text}
            onChange={(event) => updateItemText(item.id, event.target.value)}
            onKeyDown={(event) => handleKeyDown(event, item.id, index)}
            placeholder={text(lang, "ownerNotebookItemPlaceholder")}
            dir={lang === "ar" ? "rtl" : "ltr"}
            className="min-w-0 flex-1 bg-transparent py-1 text-taq-body-sm font-bold text-[var(--taq-color-112a46)] outline-none placeholder:font-bold placeholder:text-[var(--taq-color-a99d87)]"
          />
          {items.length > 1 ? (
            <button
              type="button"
              onClick={() => removeItem(item.id)}
              aria-label={text(lang, "delete")}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[var(--taq-color-b44747)]/80 hover:bg-[var(--taq-color-fff1ee)]"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
      ))}
      <button
        type="button"
        onClick={onEnterOnLast}
        className="inline-flex items-center gap-1 rounded-lg px-1 py-1 text-[10px] font-black text-[var(--taq-color-827762)] hover:text-[var(--taq-color-112a46)]"
      >
        <Plus className="h-3 w-3" />
        {text(lang, "ownerNotebookAddItem")}
      </button>
    </div>
  );
}

function TaskChecklistDisplay({ lang, note, onToggleItem }: { lang: DisplayLang; note: { checklist?: Array<{ id: string; text: string; done?: boolean }> }; onToggleItem?: (itemId: string) => void }) {
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
              item.done ? "bg-[var(--taq-color-257844)] text-white ring-[var(--taq-color-257844)]" : "bg-white text-transparent ring-[var(--taq-color-d9d0c0)] hover:ring-[var(--taq-color-257844)]/40"
            }`}
          >
            <Check className="h-3 w-3" />
          </button>
          <span className={`text-taq-body-sm font-bold leading-6 ${
            item.done ? "text-[var(--taq-color-a99d87)] line-through" : "text-[var(--taq-color-112a46)]"
          }`}
          >
            {item.text}
          </span>
        </li>
      ))}
    </ul>
  );
}

function buildComposerChecklist(items: Array<{ id: string; text: string }>) {
  return normalizeChecklist(
    items
      .map((item) => ({ ...item, text: item.text.trim() }))
      .filter((item) => item.text),
  );
}

function canSubmitComposer({ kind, draft, checklistItems }: { kind: string; draft: string; checklistItems: Array<{ id: string; text: string }> }) {
  if (kind === "note") return draft.trim().length > 0;
  return hasOwnerNotebookTaskContent("task", draft, buildComposerChecklist(checklistItems));
}

export function NoteComposerPanel({
  lang,
  notebookTheme,
  onAdd,
  onCancel,
}: {
  lang: DisplayLang;
  notebookTheme: string;
  onAdd: (payload: Record<string, unknown>) => void | boolean;
  onCancel: () => void;
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

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
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
    boxShadow: notebookThemes[color as NotebookThemeId]?.shadow || undefined,
  };

  const placeholder = kind === "task"
    ? text(lang, "ownerNotebookTaskTitle")
    : text(lang, "ownerNotebookPlaceholder");

  return (
    <article
      className="overflow-hidden rounded-[18px] border border-[var(--taq-color-e8e1d4)] px-3 py-2.5 shadow-[0_6px_14px_rgba(17,42,70,0.05)]"
      style={cardStyle}
    >
      <NoteTextFieldWithColorPicker
        lang={lang}
        value={draft}
        onChange={(value) => setDraft(value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        color={color}
        onColorChange={setColor}
        textareaRef={textareaRef}
      />
      {kind === "task" ? (
        <div className="mt-2 border-t border-[var(--taq-color-e8e1d4)]/80 pt-2">
          <TaskChecklistEditor
            lang={lang}
            items={checklistItems}
            onChange={(items) => setChecklistItems(items as ReturnType<typeof createChecklistItem>[])}
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
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[var(--taq-color-112a46)] px-3 py-2 text-[11px] font-black text-white disabled:opacity-45"
        >
          <Plus className="h-3.5 w-3.5" />
          {text(lang, "ownerNotebookAdd")}
        </button>
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="shrink-0 rounded-xl bg-white px-3 py-2 text-[11px] font-black text-[var(--taq-color-827762)] ring-1 ring-[var(--taq-color-e8e1d4)]"
          >
            {text(lang, "cancel")}
          </button>
        ) : null}
      </div>
    </article>
  );
}

function NoteEditPanel({ lang, note, onSave, onCancel, onDelete }: {
  lang: DisplayLang;
  note: { text?: string; kind?: string; color?: string; checklist?: Array<{ id: string; text: string }> };
  onSave: (payload: Record<string, unknown>) => void;
  onCancel: () => void;
  onDelete: () => void;
}) {
  const [draft, setDraft] = useState(note.text ?? "");
  const [kind, setKind] = useState(note.kind ?? "task");
  const [color, setColor] = useState(note.color ?? "shami");
  const [checklistItems, setChecklistItems] = useState<Array<{ id: string; text: string }>>(
    () => (note.checklist?.length ? note.checklist : [createChecklistItem("")]),
  );
  const textareaRef = useAutoGrowTextarea(draft, { minHeight: (kind ?? "task") === "task" ? 48 : 72 });

  useEffect(() => {
    setDraft(note.text ?? "");
    setKind(note.kind ?? "task");
    setColor(note.color ?? "shami");
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
    <div className="border-t border-[var(--taq-color-e8e1d4)] px-3 py-2.5" style={cardStyle}>
      <NoteTextFieldWithColorPicker
        lang={lang}
        value={draft}
        onChange={(value) => setDraft(value)}
        color={color}
        onColorChange={setColor}
        textareaRef={textareaRef}
        placeholder={kind === "task" ? text(lang, "ownerNotebookTaskTitle") : text(lang, "ownerNotebookPlaceholder")}
      />
      {kind === "task" ? (
        <div className="mt-2 border-t border-[var(--taq-color-e8e1d4)]/80 pt-2">
          <TaskChecklistEditor
            lang={lang}
            items={checklistItems}
            onChange={(items) => setChecklistItems(items as ReturnType<typeof createChecklistItem>[])}
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
          className="flex-1 rounded-xl bg-[var(--taq-color-112a46)] px-3 py-2 text-[11px] font-black text-white disabled:opacity-45"
        >
          {text(lang, "save")}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="shrink-0 rounded-xl bg-white px-3 py-2 text-[11px] font-black text-[var(--taq-color-827762)] ring-1 ring-[var(--taq-color-e8e1d4)]"
        >
          {text(lang, "cancel")}
        </button>
        <button
          type="button"
          onClick={onDelete}
          aria-label={text(lang, "delete")}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--taq-color-fff1ee)] text-[var(--taq-color-b44747)] ring-1 ring-[var(--taq-color-b44747)]/10"
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
}: {
  lang: DisplayLang;
  note: Record<string, unknown> & { id: string; kind?: string; color?: string; done?: boolean; checklist?: Array<{ id: string; text: string; done?: boolean }>; text?: string; createdAt?: string; updatedAt?: string };
  editing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: (payload: Record<string, unknown>) => void;
  onDelete: () => void;
  onToggleDone: () => void;
  onToggleChecklistItem: (itemId: string) => void;
  onShare: (note?: Record<string, unknown>) => void;
}) {
  const hasChecklist = note.kind === "task" && (note.checklist?.length ?? 0) > 0;
  const cardStyle = {
    backgroundColor: notebookCardBackground(note.color ?? "shami"),
    boxShadow: notebookThemes[(note.color ?? "shami") as NotebookThemeId]?.shadow || undefined,
  };
  const accentColor = note.kind === "task"
    ? (note.done ? "var(--taq-color-a99d87)" : "var(--taq-color-257844)")
    : (notebookThemes[(note.color ?? "shami") as NotebookThemeId]?.margin || "var(--taq-color-c28a30)");

  return (
    <article
      className={`overflow-hidden rounded-[19px] border border-[var(--taq-color-e8e1d4)] shadow-[0_8px_18px_rgba(17,42,70,0.06)] transition-opacity duration-150 ${
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
              note.done ? "bg-[var(--taq-color-257844)] text-white ring-[var(--taq-color-257844)]" : "bg-white text-transparent ring-[var(--taq-color-d9d0c0)] hover:ring-[var(--taq-color-257844)]/40"
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
              <span className="text-[10px] font-bold text-[var(--taq-color-a99d87)]">{formatNoteTime(note.updatedAt, lang)}</span>
            </div>
            {!editing ? (
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => onShare(note)}
                  aria-label={text(lang, "ownerNotebookShare")}
                  className="flex h-8 w-8 items-center justify-center rounded-xl text-[var(--taq-color-827762)] transition-colors duration-150 hover:bg-white/70 hover:text-[var(--taq-color-112a46)]"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={onEdit}
                  aria-label={text(lang, "manage")}
                  className="flex h-8 w-8 items-center justify-center rounded-xl text-[var(--taq-color-827762)] transition-colors duration-150 hover:bg-white/70 hover:text-[var(--taq-color-112a46)]"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={onDelete}
                  aria-label={text(lang, "delete")}
                  className="flex h-8 w-8 items-center justify-center rounded-xl text-[var(--taq-color-b44747)]/80 transition-colors duration-150 hover:bg-[var(--taq-color-fff1ee)] hover:text-[var(--taq-color-b44747)]"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : null}
          </div>
          {note.text ? (
            <p className={`whitespace-pre-wrap text-taq-body-sm font-bold leading-6 ${
              note.done && !hasChecklist ? "text-[var(--taq-color-a99d87)] line-through" : "text-[var(--taq-color-112a46)]"
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
          note={note as { text?: string; kind?: string; color?: string; checklist?: Array<{ id: string; text: string }> }}
          onSave={onSave}
          onCancel={onCancel}
          onDelete={onDelete}
        />
      ) : null}
    </article>
  );
}

export function NotebookEmptyState({ lang, onAddNew }: { lang: DisplayLang; onAddNew: () => void }) {
  return (
    <div className="px-3 py-10 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--taq-color-f7f5ef)] text-[var(--taq-color-806528)] ring-1 ring-[var(--taq-color-e8e1d4)]">
        <BookMarked className="h-5 w-5" />
      </div>
      <p className="text-taq-body-sm font-black text-[var(--taq-color-112a46)]">{text(lang, "ownerNotebookEmpty")}</p>
      <p className="mx-auto mt-2 max-w-[240px] text-taq-meta font-bold leading-5 text-[var(--taq-color-827762)]">
        {text(lang, "ownerNotebookEmptyCta")}
      </p>
      <button
        type="button"
        onClick={onAddNew}
        className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-[var(--taq-color-112a46)] px-4 py-2.5 text-taq-meta font-black text-white"
      >
        <Plus className="h-4 w-4" />
        {text(lang, "ownerNotebookNew")}
      </button>
    </div>
  );
}
