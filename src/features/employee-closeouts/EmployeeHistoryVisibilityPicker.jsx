"use client";

import { EMPLOYEE_HISTORY_VISIBILITY } from "./employee-closeout-history";

const OPTIONS = [
  { id: EMPLOYEE_HISTORY_VISIBILITY.week, labelAr: "أسبوع", labelEn: "Week" },
  { id: EMPLOYEE_HISTORY_VISIBILITY.month, labelAr: "شهر", labelEn: "Month" },
  { id: EMPLOYEE_HISTORY_VISIBILITY.all, labelAr: "الكل", labelEn: "All" },
];

export default function EmployeeHistoryVisibilityPicker({ lang, value = EMPLOYEE_HISTORY_VISIBILITY.month, onChange }) {
  const active = value || EMPLOYEE_HISTORY_VISIBILITY.month;
  return (
    <div className="mb-4 rounded-3xl bg-white p-4 ring-1 ring-black/[0.045]">
      <p className="mb-1 text-xs font-black text-[#112A46]">
        {lang === "ar" ? "عرض التقفيلات السابقة للموظف" : "Employee past closeouts"}
      </p>
      <p className="mb-3 text-taq-meta font-bold leading-5 text-[#827762]">
        {lang === "ar"
          ? "يحدد ما يظهر للموظف من تقفيلاته السابقة في هذا المحل (لا يحذف البيانات من النظام)."
          : "Controls how far back this shop's employees can browse their own closeouts (data is not deleted)."}
      </p>
      <div className="grid grid-cols-3 gap-2">
        {OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange?.(option.id)}
            className={`rounded-xl py-3 text-taq-meta font-black transition ${active === option.id ? "bg-[#112A46] text-white" : "bg-[#F7F5EF] text-[#716753] ring-1 ring-black/[0.05]"}`}
          >
            {lang === "ar" ? option.labelAr : option.labelEn}
          </button>
        ))}
      </div>
    </div>
  );
}
