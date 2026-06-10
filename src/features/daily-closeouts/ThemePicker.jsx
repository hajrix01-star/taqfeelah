"use client";

import { Check } from "lucide-react";
import { NOTEBOOK_THEME_IDS, notebookThemes } from "./notebook-themes";

const themeLabels = {
  ar: {
    yellow: "أصفر",
    softYellow: "أصفر فاتح",
    ivory: "عاجي",
    white: "أبيض",
    greenTint: "أخضر فاتح",
    pinkTint: "وردي فاتح",
    blueTint: "أزرق فاتح",
  },
  en: {
    yellow: "Yellow",
    softYellow: "Soft yellow",
    ivory: "Ivory",
    white: "White",
    greenTint: "Green tint",
    pinkTint: "Light pink",
    blueTint: "Light blue",
  },
};

export default function ThemePicker({ lang = "ar", theme, onChange }) {
  const labels = themeLabels[lang] || themeLabels.ar;
  return (
    <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
      {NOTEBOOK_THEME_IDS.map((id) => {
        const active = theme === id;
        return (
          <button key={id} type="button" onClick={() => onChange(id)} className="flex flex-col items-center gap-1.5" title={labels[id]}>
            <span
              className={`relative block h-7 w-7 rounded-full border ${active ? "border-[#112A46] ring-2 ring-[#112A46]/15" : "border-[#D9D1C1]"}`}
              style={{ backgroundColor: notebookThemes[id].paper }}
            >
              {active && <Check className="absolute inset-0 m-auto h-4 w-4 text-[#112A46]" strokeWidth={3} />}
            </span>
            <span className={`max-w-[50px] text-center text-taq-nav font-bold leading-3 ${active ? "text-[#112A46]" : "text-[#827762]"}`}>{labels[id]}</span>
          </button>
        );
      })}
    </div>
  );
}
