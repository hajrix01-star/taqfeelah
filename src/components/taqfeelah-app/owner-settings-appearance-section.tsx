"use client";

import { isNotebookThemeDirty } from "@/features/org-config/client/owner-settings-appearance-actions";
import { text } from "./taqfeelah-app-catalog-data";
import { SettingsPageHeader } from "./owner-settings-ui-primitives";
import { ThemePicker } from "./taqfeelah-app-notebook";
import { SettingsSectionFrame } from "./owner-settings-section-frame";
import type { OwnerSettingsSectionCommonProps } from "./taqfeelah-app-types";

export function OwnerSettingsAppearanceSection({
  lang,
  draftNotebookTheme,
  setDraftNotebookTheme,
  notebookTheme,
  themeDirty,
  setThemeDirty,
  setNotebookTheme,
  showSettingsSaved,
  settingsSuccess,
  setSection,
  embedded = false,
}: OwnerSettingsSectionCommonProps & {
  draftNotebookTheme: string;
  setDraftNotebookTheme: (value: string) => void;
  notebookTheme: string;
  themeDirty: boolean;
  setThemeDirty: (value: boolean) => void;
  setNotebookTheme: (value: string) => void;
  showSettingsSaved: () => void;
  settingsSuccess: boolean;
}) {
  return (
    <SettingsSectionFrame embedded={embedded}>
      {!embedded ? (
        <SettingsPageHeader title={text(lang, "notebookAppearance")} onBack={() => setSection("home")} lang={lang} />
      ) : null}
      <div className="rounded-3xl bg-white p-4 ring-1 ring-black/[0.045]">
        <ThemePicker lang={lang} theme={draftNotebookTheme} onChange={(nextTheme) => { setDraftNotebookTheme(nextTheme); setThemeDirty(isNotebookThemeDirty(nextTheme, notebookTheme)); }} />
        {themeDirty && (
          <div className="mt-4 grid grid-cols-[0.9fr_1.35fr] gap-3">
            <button onClick={() => { setDraftNotebookTheme(notebookTheme); setThemeDirty(false); }} className="rounded-2xl bg-[#F7F5EF] py-3 text-xs font-black">{text(lang, "cancelChanges")}</button>
            <button onClick={() => { setNotebookTheme(draftNotebookTheme); setThemeDirty(false); showSettingsSaved(); }} className="rounded-2xl bg-[#112A46] py-3 text-xs font-black text-white">{text(lang, "saveSettings")}</button>
          </div>
        )}
        {settingsSuccess && <div className="mt-4 rounded-xl bg-[#E6F5E9] p-3 text-center text-taq-meta font-black text-[#257844]">{text(lang, "changesSaved")}</div>}
      </div>
    </SettingsSectionFrame>
  );
}
