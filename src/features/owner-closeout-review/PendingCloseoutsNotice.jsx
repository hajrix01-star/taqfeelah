"use client";

export default function PendingCloseoutsNotice({ lang, pending = [], onView }) {
  if (!pending.length) return null;
  const count = pending.length;
  return (
    <div className="mx-2 mb-3 rounded-2xl bg-[#FFF4D2] p-3 ring-1 ring-[#C28A30]/20">
      <p className="text-[11px] font-black text-[#806528]">{lang === "ar" ? "تقفيلات بانتظار المراجعة" : "Closeouts pending review"}</p>
      <p className="mt-1 text-[10px] font-bold text-[#716753]">
        {lang === "ar"
          ? `لديك ${count} تقفيلة جديدة من الموظفين`
          : `You have ${count} new employee closeout${count > 1 ? "s" : ""}`}
      </p>
      <button type="button" onClick={onView} className="mt-3 w-full rounded-xl bg-[#112A46] py-2.5 text-[10px] font-black text-white">
        {lang === "ar" ? "عرض التقفيلات" : "View closeouts"}
      </button>
    </div>
  );
}
