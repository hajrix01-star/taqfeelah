"use client";

import { isNotebookAppearanceDirty } from "@/features/org-config/client/owner-settings-appearance-actions";
import { notebookLinesBackground } from "@/features/daily-closeouts/notebook-themes";
import { text } from "./taqfeelah-app-catalog-data";
import { SettingsPageHeader } from "./owner-settings-ui-primitives";
import { ThemePicker } from "./taqfeelah-app-notebook";
import { SettingsSectionFrame } from "./owner-settings-section-frame";
import type { NotebookPatternId } from "./taqfeelah-app-types";
import type { OwnerSettingsSectionCommonProps } from "./taqfeelah-app-types";

const NOTEBOOK_PATTERN_OPTIONS: Array<{ id: NotebookPatternId; labelAr: string; labelEn: string }> = [
  { id: "lined", labelAr: "مخطط", labelEn: "Lined" },
  { id: "grid", labelAr: "مربعات", labelEn: "Grid" },
  { id: "blank", labelAr: "فاضي", labelEn: "Blank" },
];

export function OwnerSettingsAppearanceSection({
  lang,
  draftNotebookTheme,
  setDraftNotebookTheme,
  notebookTheme,
  draftNotebookPattern,
  setDraftNotebookPattern,
  notebookPattern,
  themeDirty,
  setThemeDirty,
  setNotebookTheme,
  setNotebookPattern,
  showSettingsSaved,
  settingsSuccess,
  setSection,
  embedded = false,
}: OwnerSettingsSectionCommonProps & {
  draftNotebookTheme: string;
  setDraftNotebookTheme: (value: string) => void;
  notebookTheme: string;
  draftNotebookPattern: NotebookPatternId | string;
  setDraftNotebookPattern: (value: NotebookPatternId | string) => void;
  notebookPattern: NotebookPatternId | string;
  themeDirty: boolean;
  setThemeDirty: (value: boolean) => void;
  setNotebookTheme: (value: string) => void;
  setNotebookPattern: (value: NotebookPatternId | string) => void;
  showSettingsSaved: () => void;
  settingsSuccess: boolean;
}) {
  const updateDirty = (nextTheme: string, nextPattern: NotebookPatternId | string) => {
    setThemeDirty(isNotebookAppearanceDirty({
      draftTheme: nextTheme,
      currentTheme: notebookTheme,
      draftPattern: String(nextPattern),
      currentPattern: String(notebookPattern),
    }));
  };

  return (
    <SettingsSectionFrame embedded={embedded}>
      {!embedded ? (
        <SettingsPageHeader title={text(lang, "notebookAppearance")} onBack={() => setSection("home")} lang={lang} />
      ) : null}
      <div className="rounded-3xl bg-white p-4 ring-1 ring-black/[0.045]">
        <ThemePicker lang={lang} theme={draftNotebookTheme} onChange={(nextTheme) => { setDraftNotebookTheme(nextTheme); updateDirty(nextTheme, draftNotebookPattern); }} />
        <div className="mt-5">
          <div className="mb-2 text-xs font-black text-[var(--taq-color-827762)]">
            {lang === "ar" ? "نوع الورق" : "Paper pattern"}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {NOTEBOOK_PATTERN_OPTIONS.map((option) => {
              const active = draftNotebookPattern === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    setDraftNotebookPattern(option.id);
                    updateDirty(draftNotebookTheme, option.id);
                  }}
                  className={`rounded-2xl p-2 text-start ring-1 transition ${active ? "bg-[var(--taq-color-f7f5ef)] ring-[var(--taq-color-112a46)]" : "bg-white ring-black/[0.06]"}`}
                >
                  <span className="block h-14 rounded-xl ring-1 ring-black/[0.04]" style={notebookLinesBackground(draftNotebookTheme, option.id)} />
                  <span className="mt-2 block text-center text-xs font-black text-[var(--taq-color-112a46)]">
                    {lang === "ar" ? option.labelAr : option.labelEn}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        {themeDirty && (
          <div className="mt-4 grid grid-cols-[0.9fr_1.35fr] gap-3">
            <button onClick={() => { setDraftNotebookTheme(notebookTheme); setDraftNotebookPattern(notebookPattern); setThemeDirty(false); }} className="rounded-2xl bg-[var(--taq-color-f7f5ef)] py-3 text-xs font-black">{text(lang, "cancelChanges")}</button>
            <button onClick={() => { setNotebookTheme(draftNotebookTheme); setNotebookPattern(draftNotebookPattern); setThemeDirty(false); showSettingsSaved(); }} className="rounded-2xl bg-[var(--taq-color-112a46)] py-3 text-xs font-black text-white">{text(lang, "saveSettings")}</button>
          </div>
        )}
        {settingsSuccess && <div className="mt-4 rounded-xl bg-[var(--taq-color-e6f5e9)] p-3 text-center text-taq-meta font-black text-[var(--taq-color-257844)]">{text(lang, "changesSaved")}</div>}
      </div>
    </SettingsSectionFrame>
  );
}
